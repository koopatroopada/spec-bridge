import { describe, expect, it, beforeEach } from "vitest";
import {
  loadSpecs,
  saveSpec,
  getSpec,
  deleteSpec,
  duplicateSpec,
} from "@/lib/storage";
import type { Spec } from "@/lib/spec-schema";

const sampleSpec: Spec = {
  name: "邮件分类器",
  description: "分类邮件",
  prompt_template: "{{email}}",
  examples: [{ input: { email: "A" }, expected_output: "high" }],
  eval_criteria: [{ description: "准确性" }],
};

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("loadSpecs returns empty array when nothing stored", () => {
    expect(loadSpecs()).toEqual([]);
  });

  it("saveSpec stores a new spec", () => {
    saveSpec("spec-1", sampleSpec);
    const specs = loadSpecs();
    expect(specs).toHaveLength(1);
    expect(specs[0]!.id).toBe("spec-1");
    expect(specs[0]!.spec.name).toBe("邮件分类器");
  });

  it("saveSpec updates existing spec", () => {
    saveSpec("spec-1", sampleSpec);
    saveSpec("spec-1", { ...sampleSpec, name: "更新后" });
    const specs = loadSpecs();
    expect(specs).toHaveLength(1);
    expect(specs[0]!.spec.name).toBe("更新后");
    expect(specs[0]!.updatedAt).toBeGreaterThanOrEqual(specs[0]!.createdAt);
  });

  it("getSpec returns undefined for missing id", () => {
    expect(getSpec("missing")).toBeUndefined();
  });

  it("getSpec returns stored spec", () => {
    saveSpec("spec-1", sampleSpec);
    const found = getSpec("spec-1");
    expect(found).toBeDefined();
    expect(found!.spec.name).toBe("邮件分类器");
  });

  it("deleteSpec removes spec", () => {
    saveSpec("spec-1", sampleSpec);
    deleteSpec("spec-1");
    expect(loadSpecs()).toHaveLength(0);
  });

  it("duplicateSpec creates a copy with new id", () => {
    saveSpec("spec-1", sampleSpec);
    const newId = duplicateSpec("spec-1");
    expect(newId).not.toBeNull();
    expect(newId).not.toBe("spec-1");

    const specs = loadSpecs();
    expect(specs).toHaveLength(2);

    const copy = specs.find((s) => s.id === newId);
    expect(copy).toBeDefined();
    expect(copy!.spec.name).toBe("邮件分类器 (副本)");
  });

  it("duplicateSpec returns null for missing id", () => {
    expect(duplicateSpec("missing")).toBeNull();
  });
});
