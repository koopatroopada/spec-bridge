import type { LintResult } from "@/lib/linter";

export function LintPanel({ result }: { result: LintResult }) {
  if (result.issues.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          ✅ lint 通过 — 未发现异常
        </p>
      </div>
    );
  }

  const errorCount = result.issues.filter((i) => i.severity === "error").length;
  const warningCount = result.issues.filter(
    (i) => i.severity === "warning"
  ).length;

  return (
    <div
      className={`rounded-lg border p-4 ${
        result.valid
          ? "border-yellow-200 bg-yellow-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <p
        className={`text-sm font-medium ${
          result.valid ? "text-yellow-800" : "text-red-800"
        }`}
      >
        {result.valid
          ? `⚠️ 发现 ${warningCount} 个警告`
          : `❌ 发现 ${errorCount} 个错误，${warningCount} 个警告`}
      </p>

      <ul className="mt-3 space-y-2">
        {result.issues.map((issue, idx) => (
          <li
            key={idx}
            className={`flex items-start gap-2 rounded px-2 py-1.5 text-sm ${
              issue.severity === "error"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            <span className="mt-0.5 font-mono text-xs font-bold uppercase">
              {issue.severity}
            </span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
