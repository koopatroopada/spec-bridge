import { describe, expect, it } from "vitest";
import { exportToPrdMarkdown } from "@/lib/exporters/prd-markdown";

const validSpec = {
  name: "邮件分类器",
  description: "把客户邮件按紧急程度分类",
  prompt_template: "你是邮件分类助手。邮件:{{input}}\n输出 high/medium/low。",
  examples: [
    {
      input: { email: "我订单还没发货!" },
      expected_output: "high",
    },
  ],
  eval_criteria: [
    { description: "输出必须是 high/medium/low 之一" },
  ],
};

describe("exportToPrdMarkdown", () => {
  it("includes the spec name as h1", () => {
    const md = exportToPrdMarkdown(validSpec);
    expect(md).toContain("# 邮件分类器");
  });

  it("includes the description", () => {
    const md = exportToPrdMarkdown(validSpec);
    expect(md).toContain("把客户邮件按紧急程度分类");
  });

  it("includes the prompt template in a code block", () => {
    const md = exportToPrdMarkdown(validSpec);
    expect(md).toContain("```text");
    expect(md).toContain("你是邮件分类助手。邮件:{{input}}");
  });

  it("includes the example as a table row", () => {
    const md = exportToPrdMarkdown(validSpec);
    expect(md).toContain("| # | 输入变量 | 期望输出 | 判断方式 |");
    expect(md).toContain("| 1 | email=我订单还没发货! | high | 完全相等 |");
  });

  it("includes the eval criteria as a numbered list", () => {
    const md = exportToPrdMarkdown(validSpec);
    expect(md).toContain("1. 输出必须是 high/medium/low 之一");
  });

  it("handles multiple examples", () => {
    const multi = {
      ...validSpec,
      examples: [
        { input: { email: "A" }, expected_output: "high" },
        { input: { email: "B" }, expected_output: "low" },
      ],
    };
    const md = exportToPrdMarkdown(multi);
    expect(md).toContain("| 1 | email=A | high | 完全相等 |");
    expect(md).toContain("| 2 | email=B | low | 完全相等 |");
  });

  it("handles multiple eval criteria", () => {
    const multi = {
      ...validSpec,
      eval_criteria: [
        { description: "准确性" },
        { description: "简洁性" },
      ],
    };
    const md = exportToPrdMarkdown(multi);
    expect(md).toContain("1. 准确性");
    expect(md).toContain("2. 简洁性");
  });

  it("throws on invalid spec", () => {
    expect(() => exportToPrdMarkdown({ ...validSpec, name: "" })).toThrow();
  });

  it("renders assertion_type labels in Chinese", () => {
    const cases = [
      { type: "equals" as const, label: "完全相等" },
      { type: "contains" as const, label: "包含" },
      { type: "similar" as const, label: "语义相似" },
      { type: "json" as const, label: "合法 JSON" },
    ];
    for (const { type, label } of cases) {
      const md = exportToPrdMarkdown({
        ...validSpec,
        examples: [
          {
            input: { email: "x" },
            expected_output: "y",
            assertion_type: type,
          },
        ],
      });
      expect(md).toContain(`| ${label} |`);
    }
  });
});
