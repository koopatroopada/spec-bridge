# Spec 格式说明

spec-bridge 的 spec 是一个 JSON 对象，描述「这个 AI 功能要做什么、给什么输入、期望什么输出、按什么标准评判」。

字段定义和校验规则的源头是 `src/lib/spec-schema.ts` 里的 zod schema，本文档解释字段语义。修改 schema 时，先改本文档，再改代码。

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | 是 | 功能名，1–100 字符 |
| `description` | string | 是 | 一句话功能说明，1–1000 字符 |
| `prompt_template` | string | 是 | Prompt 模板，用 `{{var}}` 占位 |
| `examples` | Example[] | 是 | 至少 1 个示例 |
| `eval_criteria` | EvalCriterion[] | 是 | 至少 1 个评估维度 |

## Example

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `input` | `Record<string, string>` | 是 | 模板变量 → 具体值 |
| `expected_output` | string | 是 | 期望输出的字符串 |
| `assertion_type` | enum | 否，默认 `equals` | 怎么判断「实际输出」是否匹配 `expected_output` |

### `assertion_type` 怎么选

不同任务该用不同的判断方式，否则评测要么过严（语义对了但字面不一样就判失败），要么过松（什么都通过）。

| 值 | 适用任务 | 判断方式 | 备注 |
|---|---|---|---|
| `equals` | 分类、固定输出 | 字符串完全相等 | 默认值。适合输出严格枚举（如 `high`/`medium`/`low`）的任务 |
| `contains` | 关键词命中 | 实际输出包含 `expected_output` 字串 | 适合输出里只要含某个关键词就算对（如必须包含 `positive`） |
| `similar` | 摘要、改写、回复 | 语义相似度（cosine） | 适合开放生成。需要 embedding provider，导出的 YAML 默认走硅基流动的 `BAAI/bge-large-zh-v1.5`（中文优先），要在环境变量里设 `SILICONFLOW_API_KEY` |
| `json` | 结构化输出 | 输出是合法 JSON | 只校验格式合法。`expected_output` 仍要写（作为 PRD 里给读者参考的样例），但 promptfoo 不会拿它对比 |

> **背后机制**：导出到 promptfoo YAML 时，`equals/contains/similar` 直接映射到同名断言；`json` 映射到 promptfoo 的 `is-json`（不带 value）。详见 `src/lib/exporters/promptfoo-yaml.ts`。

### 选什么的小决策树

- 输出是固定枚举或精确字符串？→ `equals`
- 输出里只要含某个关键词就行？→ `contains`
- 输出是开放生成（摘要、回复、改写），意思对就行？→ `similar`
- 输出必须是 JSON？→ `json`

## EvalCriterion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `description` | string | 是 | 用自然语言描述一个评估维度 |

每个 `description` 在导出到 promptfoo YAML 时会通过 `src/lib/llm-rubric-converter.ts` 转成一条 `llm-rubric` 断言，附加到每个 test 上。

## 完整示例

```json
{
  "name": "邮件分类器",
  "description": "把客户邮件按紧急程度分为 high / medium / low",
  "prompt_template": "邮件：{{email}}\n输出 high/medium/low。",
  "examples": [
    {
      "input": { "email": "我订单还没发货!" },
      "expected_output": "high",
      "assertion_type": "equals"
    }
  ],
  "eval_criteria": [
    { "description": "输出必须是 high/medium/low 之一" }
  ]
}
```

## 运行导出 YAML 需要的环境变量

导出的 promptfoo YAML 默认配置：

- **chat 模型 + llm-rubric grader**：DeepSeek `deepseek-v4-flash` → 需 `DEEPSEEK_API_KEY`
- **embedding（仅 `similar` 断言用）**：硅基流动 `BAAI/bge-large-zh-v1.5` → 需 `SILICONFLOW_API_KEY`

### 跑 `npx promptfoo eval`

把环境变量放进 shell 或 `.env`：

```bash
export DEEPSEEK_API_KEY=sk-...
export SILICONFLOW_API_KEY=sk-...
npx promptfoo eval -c your-spec.yaml
```

不用 `similar` 类型的 spec 不需要 `SILICONFLOW_API_KEY`，promptfoo 不会调 embedding 接口。

### 想换 embedding provider 怎么办

打开导出的 YAML，每个 `similar` 类型的断言下都有一个 `provider` 字段，改 `id` / `apiBaseUrl` / `apiKeyEnvar` 即可。例如换成 OpenAI：

```yaml
- type: similar
  value: 摘要文本
  provider:
    id: openai:embedding:text-embedding-3-large
    config:
      apiKeyEnvar: OPENAI_API_KEY
```

或换成本地 Transformers.js（不要任何 API key）：

```yaml
- type: similar
  value: 摘要文本
  provider:
    id: transformers:feature-extraction:Xenova/bge-small-en-v1.5
```

> 注：embedding provider 写在每个 `similar` 断言上而不是 `defaultTest.options`，是因为 promptfoo 0.121.x 在 `defaultTest.options.provider` 位置不接受 type-map 写法（[issue #4478](https://github.com/promptfoo/promptfoo/issues/4478)）。
