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

  it("includes prompt template as-is", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const prompts = parsed.prompts as string[];
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toBe(
      "你是邮件分类助手。邮件:{{input}}\n输出 high/medium/low。"
    );
  });

  it("includes provider with temperature 0", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const providers = parsed.providers as Array<Record<string, unknown>>;
    expect(providers).toHaveLength(1);
    expect(providers[0]!.id).toBe("deepseek:deepseek-v4-flash");
    expect(providers[0]!.config).toEqual({ temperature: 0, showThinking: false });
  });

  it("maps examples to tests with vars and assert", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    expect(tests).toHaveLength(1);
    expect(tests[0]!.vars).toEqual({ email: "我订单还没发货!" });

    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts.length).toBeGreaterThanOrEqual(2);
    expect(asserts[0]!.type).toBe("equals");
    expect(asserts[0]!.value).toBe("high");
    expect(asserts[1]!.type).toBe("llm-rubric");
    expect(typeof asserts[1]!.value).toBe("string");
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

  it("uses 'contains' assertion when assertion_type is contains", () => {
    const spec = {
      ...validSpec,
      examples: [
        {
          input: { email: "x" },
          expected_output: "positive",
          assertion_type: "contains" as const,
        },
      ],
    };
    const yaml = exportToPromptfooYaml(spec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]).toEqual({ type: "contains", value: "positive" });
  });

  it("uses 'is-json' assertion (no value) when assertion_type is json", () => {
    const spec = {
      ...validSpec,
      examples: [
        {
          input: { email: "x" },
          expected_output: "{\"ok\": true}",
          assertion_type: "json" as const,
        },
      ],
    };
    const yaml = exportToPromptfooYaml(spec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]).toEqual({ type: "is-json" });
    expect(asserts[0]!.value).toBeUndefined();
  });

  it("defaults to 'equals' when assertion_type is omitted", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]!.type).toBe("equals");
    expect(asserts[0]!.value).toBe("high");
  });

  it("attaches SiliconFlow embedding provider to each similar assertion", () => {
    const spec = {
      ...validSpec,
      examples: [
        {
          input: { email: "x" },
          expected_output: "摘要文本",
          assertion_type: "similar" as const,
        },
      ],
    };
    const yaml = exportToPromptfooYaml(spec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]).toEqual({
      type: "similar",
      value: "摘要文本",
      provider: {
        id: "openai:embedding:BAAI/bge-large-zh-v1.5",
        config: {
          apiBaseUrl: "https://api.siliconflow.cn/v1",
          apiKeyEnvar: "SILICONFLOW_API_KEY",
        },
      },
    });
  });

  it("does not attach embedding provider to non-similar assertions", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const tests = parsed.tests as Array<Record<string, unknown>>;
    const asserts = tests[0]!.assert as Array<Record<string, unknown>>;
    expect(asserts[0]!.provider).toBeUndefined();
  });

  it("keeps deepseek as default grader for llm-rubric", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    const parsed = load(yaml) as Record<string, unknown>;
    const defaultTest = parsed.defaultTest as Record<string, unknown>;
    const options = defaultTest.options as Record<string, unknown>;
    expect(options.provider).toBe("deepseek:deepseek-v4-flash");
  });

  it("does not embed any API key in the YAML output", () => {
    const yaml = exportToPromptfooYaml(validSpec);
    expect(yaml).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(yaml).not.toContain("apiKey:");
  });
});
