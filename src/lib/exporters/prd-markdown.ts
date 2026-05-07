import { specSchema, type Spec } from "../spec-schema";

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
    "| # | 输入变量 | 期望输出 |",
    "|---|----------|----------|",
    ...validated.examples.map((ex, i) => {
      const inputVars = Object.entries(ex.input)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      return `| ${i + 1} | ${inputVars} | ${ex.expected_output} |`;
    }),
    "",
    "## 3. 评估维度",
    "",
    ...validated.eval_criteria.map((c, i) => `${i + 1}. ${c.description}`),
    "",
    "## 4. 导出配置",
    "",
    "- **默认模型**: `openai:gpt-4o-mini`",
    "- **Promptfoo YAML**: 可直接 `npx promptfoo eval` 执行",
    "",
    "---",
    "",
    "*由 [spec-bridge](https://github.com/adai/spec-bridge) 自动生成*",
  ];

  return lines.join("\n");
}
