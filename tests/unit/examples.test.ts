import { describe, expect, it } from "vitest";
import { exampleSpecs } from "@/lib/examples";
import { specSchema } from "@/lib/spec-schema";
import { exportToJson } from "@/lib/exporters/json-spec";
import { exportToPromptfooYaml } from "@/lib/exporters/promptfoo-yaml";
import { exportToPrdMarkdown } from "@/lib/exporters/prd-markdown";
import { lintSpec } from "@/lib/linter";
import { load } from "js-yaml";

describe("example specs", () => {
  it("contains exactly 3 examples", () => {
    expect(exampleSpecs).toHaveLength(3);
  });

  it.each(exampleSpecs.map((s, i) => [s.name, s, i] as const))(
    "%s validates against schema",
    (_name, spec) => {
      const result = specSchema.safeParse(spec);
      expect(result.success).toBe(true);
    }
  );

  it.each(exampleSpecs.map((s, i) => [s.name, s, i] as const))(
    "%s exports to valid JSON",
    (_name, spec) => {
      const json = exportToJson(spec);
      const parsed = JSON.parse(json);
      expect(parsed.name).toBe(spec.name);
    }
  );

  it.each(exampleSpecs.map((s, i) => [s.name, s, i] as const))(
    "%s exports to valid Promptfoo YAML",
    (_name, spec) => {
      const yaml = exportToPromptfooYaml(spec);
      const parsed = load(yaml);
      expect(parsed).toBeTruthy();
      expect((parsed as Record<string, unknown>).tests).toBeDefined();
    }
  );

  it.each(exampleSpecs.map((s, i) => [s.name, s, i] as const))(
    "%s exports to PRD markdown",
    (_name, spec) => {
      const md = exportToPrdMarkdown(spec);
      expect(md).toContain(`# ${spec.name}`);
      expect(md).toContain("## 1. Prompt 模板");
      expect(md).toContain("## 2. 示例");
    }
  );

  it.each(exampleSpecs.map((s, i) => [s.name, s, i] as const))(
    "%s passes lint",
    (_name, spec) => {
      const result = lintSpec(spec);
      expect(result.valid).toBe(true);
    }
  );
});
