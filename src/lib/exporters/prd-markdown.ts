import { specSchema, type AssertionType, type Spec } from "../spec-schema";

const ASSERTION_LABELS: Record<AssertionType, string> = {
  equals: "完全相等",
  contains: "包含",
  similar: "语义相似",
  json: "合法 JSON",
};

export function exportToPrdMarkdown(spec: Spec): string {
  const validated = specSchema.parse(spec);

  const lines: string[] = [
    `# ${validated.name}`,
    "",
    `> ${validated.description}`,
    "",
    "## 1. Prompt 模板",
    "",
    "```text",
    validated.prompt_template,
    "```",
    "",
    "## 2. 示例",
    "",
    "| # | 输入变量 | 期望输出 | 判断方式 |",
    "|---|----------|----------|----------|",
    ...validated.examples.map((ex, i) => {
      const inputVars = Object.entries(ex.input)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      return `| ${i + 1} | ${inputVars} | ${ex.expected_output} | ${ASSERTION_LABELS[ex.assertion_type]} |`;
    }),
    "",
    "## 3. 评估维度",
    "",
    ...validated.eval_criteria.map((c, i) => `${i + 1}. ${c.description}`),
    "",
    "## 4. 导出配置",
    "",
    "- **默认模型**: `deepseek:deepseek-v4-flash`",
    "- **Promptfoo YAML**: 可直接 `npx promptfoo eval` 执行",
    "",
    "---",
    "",
    "*由 [spec-bridge](https://github.com/adai/spec-bridge) 自动生成*",
  ];

  return lines.join("\n");
}
