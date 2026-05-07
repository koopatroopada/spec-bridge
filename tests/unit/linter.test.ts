import { describe, expect, it } from "vitest";
import { lintSpec } from "@/lib/linter";
import type { Spec } from "@/lib/spec-schema";

const baseSpec: Spec = {
  name: "邮件分类器",
  description: "把客户邮件按紧急程度分类",
  prompt_template: "你是邮件分类助手。邮件:{{email}}\n输出 high/medium/low。",
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

describe("lintSpec", () => {
  it("passes a valid spec", () => {
    const result = lintSpec(baseSpec);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("catches unbound variable (error)", () => {
    const spec = {
      ...baseSpec,
      prompt_template: "{{email}} {{subject}}",
    };
    const result = lintSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "unbound-variable",
          severity: "error",
          message: 'prompt 模板引用了变量 "subject"，但示例 input 中未定义',
        }),
      ])
    );
  });

  it("catches unused variable (warning)", () => {
    const spec = {
      ...baseSpec,
      examples: [
        {
          input: { email: "A", subject: "B" },
          expected_output: "high",
        },
      ],
    };
    const result = lintSpec(spec);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "unused-variable",
          severity: "warning",
          message: '示例 input 中的变量 "subject" 在 prompt 模板中未被引用',
        }),
      ])
    );
  });

  it("catches malformed placeholder (error)", () => {
    const spec = {
      ...baseSpec,
      prompt_template: "{{email",
    };
    const result = lintSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "malformed-placeholder",
          severity: "error",
        }),
      ])
    );
  });

  it("catches mismatched example keys (warning)", () => {
    const spec: Spec = {
      ...baseSpec,
      examples: [
        { input: { email: "A" }, expected_output: "high" },
        { input: { subject: "B" }, expected_output: "low" },
      ],
    };
    const result = lintSpec(spec);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "mismatched-example-keys",
          severity: "warning",
        }),
      ])
    );
  });

  it("catches vague criterion (warning)", () => {
    const spec = {
      ...baseSpec,
      eval_criteria: [{ description: "OK" }],
    };
    const result = lintSpec(spec);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "vague-criterion",
          severity: "warning",
          message: '评估维度 "OK" 描述过短（少于 5 个字符），建议写得更具体',
        }),
      ])
    );
  });

  it("catches duplicate criterion (warning)", () => {
    const spec = {
      ...baseSpec,
      eval_criteria: [
        { description: "准确性" },
        { description: "准确性" },
      ],
    };
    const result = lintSpec(spec);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: "duplicate-criterion",
          severity: "warning",
          message: '评估维度 "准确性" 重复出现',
        }),
      ])
    );
  });

  it("accumulates multiple issues", () => {
    const spec: Spec = {
      ...baseSpec,
      prompt_template: "{{email}} {{subject",
      examples: [
        { input: { email: "A", subject: "B" }, expected_output: "high" },
        { input: { email: "C", body: "D" }, expected_output: "low" },
      ],
      eval_criteria: [
        { description: "OK" },
        { description: "OK" },
      ],
    };
    const result = lintSpec(spec);
    expect(result.issues.length).toBeGreaterThanOrEqual(5);
    expect(result.valid).toBe(false);
  });
});
