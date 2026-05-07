import { dump } from "js-yaml";
import { specSchema, type Spec } from "../spec-schema";
import { convertToLlmRubric } from "../llm-rubric-converter";

export function exportToPromptfooYaml(spec: Spec): string {
  const validated = specSchema.parse(spec);

  const rubricAssertions = validated.eval_criteria.map((c) => ({
    type: "llm-rubric",
    value: convertToLlmRubric(c.description),
  }));

  const config = {
    description: `${validated.name}: ${validated.description}`,
    prompts: [validated.prompt_template],
    providers: ["openai:gpt-4o-mini"],
    tests: validated.examples.map((ex) => ({
      vars: ex.input,
      assert: [
        {
          type: "equals",
          value: ex.expected_output,
        },
        ...rubricAssertions,
      ],
    })),
  };

  return dump(config, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
