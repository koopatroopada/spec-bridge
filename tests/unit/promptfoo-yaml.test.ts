import { describe, expect, it } from "vitest";
import { exportToPromptfooYaml } from "@/lib/exporters/promptfoo-yaml";
import { load } from "js-yaml";

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

describe("exportToPromptfooYaml", () => {
  it("exports valid YAML that can be parsed back", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml);
    expect(parsed).toBeTruthy();
  });

  it("includes description combining name and description", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    expect(parsed.description).toBe("邮件分类器: 把客户邮件按紧急程度分类");
  });

  it("includes prompt as first item in prompts array", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    expect(parsed.prompts).toEqual([
      "你是邮件分类助手。邮件:{{input}}\n输出 high/medium/low。",
    ]);
  });

  it("includes default provider", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    expect(parsed.providers).toEqual(["openai:gpt-4o-mini"]);
  });

  it("maps examples to tests with vars and assert", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    expect(tests).toHaveLength(1);
    expect(tests[0]!.vars).toEqual({ email: "我订单还没发货!" });

    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts).toHaveLength(1);
    expect(asserts[0]!.type).toBe("equals");
    expect(asserts[0]!.value).toBe("high");
  });

  it("handles multiple examples", () => {
    const multiExampleSpec = {
      ...validSpec,
      examples: [
        {
          input: { email: "我订单还没发货!" },
          expected_output: "high",
        },
        {
          input: { email: "请问发票什么时候开?" },
          expected_output: "low",
        },
      ],
    };
    const yaml = exportToPromptfooYaml(multiExampleSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    expect(tests).toHaveLength(2);
    expect(tests[1]!.vars).toEqual({ email: "请问发票什么时候开?" });
    const asserts = tests[1]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]!.value).toBe("low");
  });

  it("throws on invalid spec", () => {
    expect(() =>
      exportToPromptfooYaml({ ...validSpec, name: "" })
    ).toThrow();
  });
});
