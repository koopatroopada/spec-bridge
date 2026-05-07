import type { Spec } from "../spec-schema";

const STORAGE_KEY = "spec-bridge-specs";

export interface StoredSpec {
  id: string;
  createdAt: number;
  updatedAt: number;
  spec: Spec;
}

export function loadSpecs(): StoredSpec[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSpec[]) : [];
  } catch {
    return [];
  }
}

export function getSpec(id: string): StoredSpec | undefined {
  return loadSpecs().find((s) => s.id === id);
}

export function saveSpec(id: string, spec: Spec): void {
  const specs = loadSpecs();
  const idx = specs.findIndex((s) => s.id === id);
  if (idx >= 0) {
    specs[idx] = { ...specs[idx]!, spec, updatedAt: Date.now() };
  } else {
    specs.push({
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      spec,
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
}

export function deleteSpec(id: string): void {
  const specs = loadSpecs().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
}

export function duplicateSpec(id: string): string | null {
  const specs = loadSpecs();
  const existing = specs.find((s) => s.id === id);
  if (!existing) return null;
  const newId = crypto.randomUUID();
  specs.push({
    id: newId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    spec: { ...existing.spec, name: `${existing.spec.name} (副本)` },
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  return newId;
}
