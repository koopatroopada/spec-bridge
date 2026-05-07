"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadSpecs,
  deleteSpec,
  duplicateSpec,
  type StoredSpec,
} from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [specs, setSpecs] = useState<StoredSpec[]>([]);

  useEffect(() => {
    setSpecs(loadSpecs());
  }, []);

  function handleDelete(id: string) {
    if (!confirm("确定删除这个 spec？")) return;
    deleteSpec(id);
    setSpecs(loadSpecs());
  }

  function handleDuplicate(id: string) {
    duplicateSpec(id);
    setSpecs(loadSpecs());
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">spec-bridge</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理你的 AI 功能 spec
          </p>
        </div>
        <button
          onClick={() => router.push("/editor/new")}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 新建 spec
        </button>
      </header>

      {specs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-500">还没有 spec，点击右上角新建一个</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {specs.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300"
            >
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-800">
                  {s.spec.name}
                </h3>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {s.spec.description}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  更新于{" "}
                  {new Date(s.updatedAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 gap-2">
                <button
                  onClick={() => router.push(`/editor/${s.id}`)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDuplicate(s.id)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  复制
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
