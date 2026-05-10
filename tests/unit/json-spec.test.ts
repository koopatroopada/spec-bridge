import { describe, expect, it } from "vitest";
import { exportToJson } from "@/lib/exporters/json-spec";
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

describe("exportToJson", () => {
  it("exports valid spec to formatted JSON", () => {
    const json = exportToJson(validSpec);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("邮件分类器");
    expect(parsed.examples).toHaveLength(1);
    expect(parsed.eval_criteria).toHaveLength(1);
  });

  it("throws on invalid spec", () => {
    expect(() =>
      exportToJson({ ...validSpec, name: "" })
    ).toThrow();
  });

  it("exported JSON validates against schema", () => {
    const json = exportToJson(validSpec);
    const parsed = JSON.parse(json);
    const result = specSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it("preserves nested record in examples", () => {
    const json = exportToJson(validSpec);
    const parsed = JSON.parse(json);
    expect(parsed.examples[0].input).toEqual({ email: "我订单还没发货!" });
  });

  it("fills assertion_type with default 'equals' when omitted", () => {
    const json = exportToJson(validSpec);
    const parsed = JSON.parse(json);
    expect(parsed.examples[0].assertion_type).toBe("equals");
  });

  it("preserves explicit assertion_type", () => {
    const json = exportToJson({
      ...validSpec,
      examples: [
        {
          input: { email: "x" },
          expected_output: "summary",
          assertion_type: "similar" as const,
        },
      ],
    });
    const parsed = JSON.parse(json);
    expect(parsed.examples[0].assertion_type).toBe("similar");
  });
});
