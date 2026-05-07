"use client";

import { useState } from "react";
import { SpecForm } from "@/components/spec-form/spec-form";
import { exportToJson } from "@/lib/exporters/json-spec";
import type { Spec } from "@/lib/spec-schema";

export default function HomePage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("spec.json");

  function handleSubmit(spec: Spec) {
    const json = exportToJson(spec);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setFileName(`${spec.name.replace(/\s+/g, "_")}.json`);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">spec-bridge</h1>
        <p className="mt-1 text-sm text-slate-500">
          录入 AI 功能 spec，一键导出 JSON
        </p>
      </header>

      <SpecForm onSubmit={handleSubmit} />

      {downloadUrl && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            spec 已验证通过，可下载 JSON：
          </p>
          <a
            href={downloadUrl}
            download={fileName}
            className="mt-2 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            下载 {fileName}
          </a>
        </div>
      )}
    </main>
  );
}
