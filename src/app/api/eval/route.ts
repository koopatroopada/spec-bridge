import { NextResponse } from "next/server";
import { evaluate } from "promptfoo";
import { load } from "js-yaml";
import { exportToPromptfooYaml } from "@/lib/exporters/promptfoo-yaml";
import { specSchema } from "@/lib/spec-schema";
import type { Spec } from "@/lib/spec-schema";

type EvaluateConfig = Parameters<typeof evaluate>[0];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { spec: Spec };
    const validated = specSchema.parse(body.spec);

    const yaml = exportToPromptfooYaml(validated);
    const config = load(yaml) as Record<string, unknown>;

    const result = await evaluate(
      config as EvaluateConfig,
      {
        maxConcurrency: 1,
        showProgressBar: false,
      }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
