import { z } from "zod";

export const assertionTypeSchema = z
  .enum(["equals", "similar", "contains", "json"])
  .describe("how to assert actual output matches expected_output");

export const exampleSchema = z.object({
  input: z.record(z.string(), z.string()).describe("输入变量键值对"),
  expected_output: z.string().min(1).describe("期望输出"),
  assertion_type: assertionTypeSchema.default("equals"),
});

export const evalCriterionSchema = z.object({
  description: z.string().min(1).describe("评估维度描述"),
});

export const specSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100, "名称最多 100 个字符"),
  description: z.string().min(1, "描述不能为空").max(1000, "描述最多 1000 个字符"),
  prompt_template: z.string().min(1, "prompt 模板不能为空"),
  examples: z.array(exampleSchema).min(1, "至少 1 个示例"),
  eval_criteria: z.array(evalCriterionSchema).min(1, "至少 1 个评估维度"),
});

export type Spec = z.input<typeof specSchema>;
export type Example = z.input<typeof exampleSchema>;
export type ParsedSpec = z.output<typeof specSchema>;
export type ParsedExample = z.output<typeof exampleSchema>;
export type EvalCriterion = z.infer<typeof evalCriterionSchema>;
export type AssertionType = z.infer<typeof assertionTypeSchema>;
