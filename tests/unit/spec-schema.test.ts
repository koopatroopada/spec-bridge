import { describe, expect, it } from "vitest";
import { specSchema } from "@/lib/spec-schema";

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

describe("specSchema", () => {
  it("accepts a valid spec", () => {
    const result = specSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = specSchema.safeParse({ ...validSpec, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = specSchema.safeParse({ ...validSpec, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty prompt_template", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      prompt_template: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty examples array", () => {
    const result = specSchema.safeParse({ ...validSpec, examples: [] });
    expect(result.success).toBe(false);
  });

  it("rejects example with empty expected_output", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      examples: [{ input: { x: "y" }, expected_output: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty eval_criteria array", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      eval_criteria: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects eval_criterion with empty description", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      eval_criteria: [{ description: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("defaults assertion_type to 'equals' when omitted", () => {
    const result = specSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examples[0]!.assertion_type).toBe("equals");
    }
  });

  it("accepts each valid assertion_type value", () => {
    for (const t of ["equals", "similar", "contains", "json"] as const) {
      const result = specSchema.safeParse({
        ...validSpec,
        examples: [
          { input: { x: "y" }, expected_output: "z", assertion_type: t },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid assertion_type", () => {
    const result = specSchema.safeParse({
      ...validSpec,
      examples: [
        {
          input: { x: "y" },
          expected_output: "z",
          assertion_type: "regex",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
