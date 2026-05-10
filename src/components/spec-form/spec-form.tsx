"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { assertionTypeSchema, type AssertionType, type Spec } from "@/lib/spec-schema";

const variableSchema = z.object({
  key: z.string().min(1, "变量名不能为空"),
  value: z.string().min(1, "变量值不能为空"),
});

const formSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string().min(1, "描述不能为空"),
  prompt_template: z.string().min(1, "prompt 模板不能为空"),
  variables: z.array(variableSchema).min(1, "至少 1 个变量"),
  example_expected_output: z.string().min(1, "期望输出不能为空"),
  example_assertion_type: assertionTypeSchema,
  eval_criterion: z.string().min(1, "评估维度不能为空"),
});

type FormData = z.infer<typeof formSchema>;

const ASSERTION_OPTIONS: { value: AssertionType; label: string; hint: string }[] = [
  { value: "equals", label: "完全相等", hint: "分类、固定输出" },
  { value: "contains", label: "包含", hint: "输出含某个关键词即可" },
  { value: "similar", label: "语义相似", hint: "摘要、回复等开放生成" },
  { value: "json", label: "合法 JSON", hint: "结构化输出，仅校验格式" },
];

function toSpec(data: FormData): Spec {
  const input: Record<string, string> = {};
  for (const v of data.variables) {
    input[v.key] = v.value;
  }
  return {
    name: data.name,
    description: data.description,
    prompt_template: data.prompt_template,
    examples: [
      {
        input,
        expected_output: data.example_expected_output,
        assertion_type: data.example_assertion_type,
      },
    ],
    eval_criteria: [{ description: data.eval_criterion }],
  };
}

function fromSpec(spec: Spec): FormData {
  const ex = spec.examples[0]!;
  const variables = Object.entries(ex.input).map(([key, value]) => ({
    key,
    value,
  }));
  return {
    name: spec.name,
    description: spec.description,
    prompt_template: spec.prompt_template,
    variables,
    example_expected_output: ex.expected_output,
    example_assertion_type: ex.assertion_type ?? "equals",
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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? fromSpec(initialData)
      : {
          variables: [{ key: "input", value: "" }],
          example_assertion_type: "equals",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variables",
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
        <h3 className="mb-3 text-sm font-semibold text-slate-700">示例输入变量</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">
                变量名
              </label>
              <input
                {...register(`variables.${index}.key`)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：email"
              />
              {errors.variables?.[index]?.key && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.variables[index].key.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">
                变量值
              </label>
              <input
                {...register(`variables.${index}.value`)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：我订单还没发货！"
              />
              {errors.variables?.[index]?.value && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.variables[index].value.message}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                className="mb-0.5 rounded-md border border-red-200 px-2 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-30"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ key: "", value: "" })}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          + 添加变量
        </button>
        {errors.variables?.root && (
          <p className="mt-2 text-xs text-red-600">{errors.variables.root.message}</p>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500">
            期望输出
          </label>
          <textarea
            {...register("example_expected_output")}
            rows={3}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例如：high"
          />
          {errors.example_expected_output && (
            <p className="mt-1 text-xs text-red-600">
              {errors.example_expected_output.message}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500">
            判断方式
          </label>
          <select
            {...register("example_assertion_type")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ASSERTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.hint}
              </option>
            ))}
          </select>
          {errors.example_assertion_type && (
            <p className="mt-1 text-xs text-red-600">
              {errors.example_assertion_type.message}
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
