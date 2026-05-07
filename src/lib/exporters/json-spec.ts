import { specSchema, type Spec } from "../spec-schema";

export function exportToJson(spec: Spec): string {
  const validated = specSchema.parse(spec);
  return JSON.stringify(validated, null, 2);
}
