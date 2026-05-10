import { dump } from "js-yaml";
import { specSchema, type ParsedExample, type Spec } from "../spec-schema";
import { convertToLlmRubric } from "../llm-rubric-converter";

const EMBEDDING_PROVIDER = {
  id: "openai:embedding:BAAI/bge-large-zh-v1.5",
  config: {
    apiBaseUrl: "https://api.siliconflow.cn/v1",
    apiKeyEnvar: "SILICONFLOW_API_KEY",
  },
};

type ProviderOptions = {
  id: string;
  config?: Record<string, unknown>;
};

type Assertion = {
  type: string;
  value?: string;
  provider?: ProviderOptions;
};

function buildAssertion(example: ParsedExample): Assertion {
  switch (example.assertion_type) {
    case "equals":
      return { type: "equals", value: example.expected_output };
    case "contains":
      return { type: "contains", value: example.expected_output };
    case "similar":
      return {
        type: "similar",
        value: example.expected_output,
        provider: EMBEDDING_PROVIDER,
      };
    case "json":
      return { type: "is-json" };
  }
}

export function exportToPromptfooYaml(spec: Spec): string {
  const validated = specSchema.parse(spec);

  const rubricAssertions = validated.eval_criteria.map((c) => ({
    type: "llm-rubric",
    value: convertToLlmRubric(c.description),
  }));

  const config = {
    description: `${validated.name}: ${validated.description}`,
    prompts: [validated.prompt_template],
    providers: [
      {
        id: "deepseek:deepseek-v4-flash",
        config: {
          temperature: 0,
          showThinking: false,
        },
      },
    ],
    defaultTest: {
      options: {
        provider: "deepseek:deepseek-v4-flash",
      },
    },
    tests: validated.examples.map((ex) => ({
      vars: ex.input,
      assert: [buildAssertion(ex), ...rubricAssertions],
    })),
  };

  return dump(config, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
