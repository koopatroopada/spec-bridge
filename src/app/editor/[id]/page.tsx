"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { SpecEditor } from "@/components/spec-editor/spec-editor";
import { getSpec, saveSpec } from "@/lib/storage";
import type { Spec } from "@/lib/spec-schema";

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";
  const stored = isNew ? undefined : getSpec(id);

  function handleSave(spec: Spec) {
    saveSpec(id, spec);
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? "新建 spec" : "编辑 spec"}
        </h1>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← 返回列表
        </button>
      </div>

      {isNew || stored ? (
        <SpecEditor initialSpec={stored?.spec} onSave={handleSave} />
      ) : (
        <p className="text-slate-500">找不到该 spec</p>
      )}
    </main>
  );
}
