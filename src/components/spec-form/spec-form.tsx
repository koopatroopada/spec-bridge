"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Spec } from "@/lib/spec-schema";

const formSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string().min(1, "描述不能为空"),
  prompt_template: z.string().min(1, "prompt 模板不能为空"),
  example_input_key: z.string().min(1),
  example_input_value: z.string().min(1, "示例输入值不能为空"),
  example_expected_output: z.string().min(1, "期望输出不能为空"),
  eval_criterion: z.string().min(1, "评估维度不能为空"),
});

type FormData = z.infer<typeof formSchema>;

function toSpec(data: FormData): Spec {
  return {
    name: data.name,
    description: data.description,
    prompt_template: data.prompt_template,
    examples: [
      {
        input: { [data.example_input_key]: data.example_input_value },
        expected_output: data.example_expected_output,
      },
    ],
    eval_criteria: [{ description: data.eval_criterion }],
  };
}

function fromSpec(spec: Spec): FormData {
  const ex = spec.examples[0]!;
  const inputKey = Object.keys(ex.input)[0] ?? "input";
  const inputValue = ex.input[inputKey] ?? "";
  return {
    name: spec.name,
    description: spec.description,
    prompt_template: spec.prompt_template,
    example_input_key: inputKey,
    example_input_value: inputValue,
    example_expected_output: ex.expected_output,
    eval_criterion: spec.eval_criteria[0]!.description,
  };
}

export function SpecForm({
  initialData,
  onSubmit,
  submitLabel = "生成 JSON",
}: {
  initialData?: Spec;
  onSubmit: (spec: Spec) => void;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? fromSpec(initialData) : { example_input_key: "input" },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(toSpec(data)))}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">
          功能名称
        </label>
        <input
          {...register("name")}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例如：邮件分类器"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          功能描述
        </label>
        <textarea
          {...register("description")}
          rows={3}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="一句话描述这个 AI 功能解决什么问题"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Prompt 模板
        </label>
        <textarea
          {...register("prompt_template")}
          rows={4}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={`你是邮件分类助手。\n邮件内容：{{input}}\n请输出 high/medium/low。`}
        />
        {errors.prompt_template && (
          <p className="mt-1 text-sm text-red-600">
            {errors.prompt_template.message}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">示例</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              变量名
            </label>
            <input
              {...register("example_input_key")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              变量值
            </label>
            <input
              {...register("example_input_value")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例如：我订单还没发货！"
            />
            {errors.example_input_value && (
              <p className="mt-1 text-xs text-red-600">
                {errors.example_input_value.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-500">
            期望输出
          </label>
          <input
            {...register("example_expected_output")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例如：high"
          />
          {errors.example_expected_output && (
            <p className="mt-1 text-xs text-red-600">
              {errors.example_expected_output.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          评估维度
        </label>
        <input
          {...register("eval_criterion")}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例如：输出必须是 high/medium/low 之一"
        />
        {errors.eval_criterion && (
          <p className="mt-1 text-sm text-red-600">
            {errors.eval_criterion.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
