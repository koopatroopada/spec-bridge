import type { Spec } from "../spec-schema";

export type LintSeverity = "error" | "warning";

export interface LintIssue {
  rule: string;
  severity: LintSeverity;
  message: string;
}

export interface LintResult {
  valid: boolean;
  issues: LintIssue[];
}

function parseVariables(template: string): string[] {
  const matches = template.match(/\{\{([^{}]+)\}\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2).trim());
}

function hasMalformedPlaceholder(template: string): boolean {
  const openCount = (template.match(/\{\{/g) || []).length;
  const closeCount = (template.match(/\}\}/g) || []).length;
  return openCount !== closeCount;
}

export function lintSpec(spec: Spec): LintResult {
  const issues: LintIssue[] = [];

  // 1. 未绑定变量：prompt 里用了但示例 input 没定义
  const promptVars = parseVariables(spec.prompt_template);
  for (const ex of spec.examples) {
    const exampleVars = Object.keys(ex.input);
    for (const pv of promptVars) {
      if (!exampleVars.includes(pv)) {
        issues.push({
          rule: "unbound-variable",
          severity: "error",
          message: `prompt 模板引用了变量 "${pv}"，但示例 input 中未定义`,
        });
      }
    }
  }

  // 2. 未使用变量：示例 input 里有但 prompt 里没引用
  for (const ex of spec.examples) {
    for (const ev of Object.keys(ex.input)) {
      if (!promptVars.includes(ev)) {
        issues.push({
          rule: "unused-variable",
          severity: "warning",
          message: `示例 input 中的变量 "${ev}" 在 prompt 模板中未被引用`,
        });
      }
    }
  }

  // 3. 占位符格式错误
  if (hasMalformedPlaceholder(spec.prompt_template)) {
    issues.push({
      rule: "malformed-placeholder",
      severity: "error",
      message: 'prompt 模板中存在不完整的 {{ }} 占位符',
    });
  }

  // 4. 示例 input 变量名不一致
  if (spec.examples.length >= 2) {
    const firstKeys = Object.keys(spec.examples[0]!.input).sort();
    for (let i = 1; i < spec.examples.length; i++) {
      const keys = Object.keys(spec.examples[i]!.input).sort();
      const match =
        keys.length === firstKeys.length &&
        keys.every((k, idx) => k === firstKeys[idx]);
      if (!match) {
        issues.push({
          rule: "mismatched-example-keys",
          severity: "warning",
          message: `示例 ${i + 1} 的 input 变量与示例 1 不一致`,
        });
      }
    }
  }

  // 5. 评估维度描述过短
  for (const c of spec.eval_criteria) {
    if (c.description.length < 5) {
      issues.push({
        rule: "vague-criterion",
        severity: "warning",
        message: `评估维度 "${c.description}" 描述过短（少于 5 个字符），建议写得更具体`,
      });
    }
  }

  // 6. 评估维度重复
  const seen = new Set<string>();
  for (const c of spec.eval_criteria) {
    if (seen.has(c.description)) {
      issues.push({
        rule: "duplicate-criterion",
        severity: "warning",
        message: `评估维度 "${c.description}" 重复出现`,
      });
    }
    seen.add(c.description);
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { valid: !hasError, issues };
}
