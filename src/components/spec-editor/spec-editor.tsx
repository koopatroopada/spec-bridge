"use client";

import { useState } from "react";
import { SpecForm } from "@/components/spec-form/spec-form";
import { LintPanel } from "@/components/lint-panel/lint-panel";
import { exportToJson } from "@/lib/exporters/json-spec";
import { exportToPromptfooYaml } from "@/lib/exporters/promptfoo-yaml";
import { exportToPrdMarkdown } from "@/lib/exporters/prd-markdown";
import { lintSpec, type LintResult } from "@/lib/linter";
import type { Spec } from "@/lib/spec-schema";

type DownloadItem = {
  label: string;
  fileName: string;
  url: string;
};

type EvalResult = {
  success: boolean;
  result?: {
    results?: Array<{
      prompt: string;
      response: {
        output: string;
      };
      success: boolean;
      score: number;
    }>;
  };
  error?: string;
};

export function SpecEditor({
  initialSpec,
  onSave,
}: {
  initialSpec?: Spec;
  onSave: (spec: Spec) => void;
}) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [prdPreview, setPrdPreview] = useState("");
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<Spec | null>(null);

  function handleSubmit(spec: Spec) {
    const safeName = spec.name.replace(/\s+/g, "_");

    const items: DownloadItem[] = [
      {
        label: "JSON",
        fileName: `${safeName}.json`,
        url: URL.createObjectURL(
          new Blob([exportToJson(spec)], { type: "application/json" })
        ),
      },
      {
        label: "Promptfoo YAML",
        fileName: `${safeName}.yaml`,
        url: URL.createObjectURL(
          new Blob([exportToPromptfooYaml(spec)], { type: "text/yaml" })
        ),
      },
      {
        label: "PRD (Markdown)",
        fileName: `${safeName}.md`,
        url: URL.createObjectURL(
          new Blob([exportToPrdMarkdown(spec)], { type: "text/markdown" })
        ),
      },
    ];

    setDownloads(items);
    setPrdPreview(exportToPrdMarkdown(spec));
    setLintResult(lintSpec(spec));
    setSaved(false);
    setEvalResult(null);
    setCurrentSpec(spec);
  }

  async function handleRunEval() {
    if (!lintResult?.valid || !currentSpec) return;

    setEvalLoading(true);
    try {
      const res = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: currentSpec }),
      });
      const data = (await res.json()) as EvalResult;
      setEvalResult(data);
    } catch (err) {
      setEvalResult({ success: false, error: String(err) });
    } finally {
      setEvalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SpecForm
        initialData={initialSpec}
        onSubmit={(spec) => {
          handleSubmit(spec);
          onSave(spec);
          setSaved(true);
        }}
        submitLabel={initialSpec ? "保存并更新" : "保存并生成"}
      />

      {saved && (
        <p className="text-sm text-green-700">✅ 已保存到 localStorage</p>
      )}

      {lintResult && (
        <section>
          <LintPanel result={lintResult} />
        </section>
      )}

      {downloads.length > 0 && (
        <section>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              spec 已验证通过，可下载：
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {downloads.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  download={item.fileName}
                  className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  下载 {item.fileName}
                </a>
              ))}
            </div>
            {lintResult?.valid && (
              <button
                onClick={handleRunEval}
                disabled={evalLoading}
                className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {evalLoading ? "测试中..." : "▶ 运行 promptfoo 测试"}
              </button>
            )}
          </div>
        </section>
      )}

      {evalResult && (
        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            测试结果
          </h3>
          {evalResult.success ? (
            <div className="space-y-2">
              {evalResult.result?.results?.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-md p-2 text-sm ${
                    r.success
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <p className="font-medium">
                    {r.success ? "✅ 通过" : "❌ 失败"} (score: {r.score})
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    输出: {r.response.output}
                  </p>
                </div>
              )) ?? (
                <p className="text-sm text-slate-500">暂无详细结果</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">
              测试失败: {evalResult.error}
            </p>
          )}
        </section>
      )}

      {prdPreview && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">
            PRD 预览
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">
              {prdPreview}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
