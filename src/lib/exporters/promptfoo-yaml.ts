import { dump } from "js-yaml";
import { specSchema, type Spec } from "../spec-schema";

export function exportToPromptfooYaml(spec: Spec): string {
  const validated = specSchema.parse(spec);

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
