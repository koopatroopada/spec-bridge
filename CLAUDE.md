# spec-bridge

填补 AI PM ↔ AI 工程之间的真空。给 Promptfoo 当 PM-friendly 前置入口：PM 在结构化表单里写 spec，一键导出可读 PRD（给同事）、机器可读 JSON（给后续工具）、Promptfoo 兼容 YAML（直接能 `npx promptfoo eval` 跑）。

> 完整背景见 `/home/adai/.claude/plans/lazy-percolating-backus.md`（计划）和 `README.md`（面向用户）。

## 目标用户

未来 1-2 年要进入 AI PM 岗位的人（包括 adai 自己）。设计任何功能时，假定使用者：

- 没有写代码能力，但能读 markdown / YAML / JSON
- 知道 LLM 概念（prompt、模型、评估），不熟工程细节
- 期望"录入需求 → 拿到能跑的产物"，不接受"先学 CLI 才能用"

## 不做的事（明确范围，避免功能蔓延）

| 不做 | 理由 |
|---|---|
| 账号系统 / 团队协作 | MVP 单机用，零运维 |
| Production tracing / observability | Braintrust / Langfuse 的活 |
| 自动 prompt 优化 | DSPy / Adaline 的活 |
| 模型 API 代理 | 用户直接走自己的 API key 跑 promptfoo |
| 后端服务 | 全部 localStorage，纯前端 |

如果未来想做这些，先回答："为什么不直接用现有工具？"

## 核心抽象

**`src/lib/spec-schema.ts` 是这个项目所有逻辑的中心**。所有功能（表单、lint、3 种导出）都围绕同一个 zod schema 工作。

修改这个 schema 时：
1. 先想清楚字段语义，更新 `docs/spec-format.md`
2. 同步更新所有依赖此 schema 的代码（编辑器表单、lint、3 个导出器）
3. 跑全量测试

## 技术栈（版本锁）

| 维度 | 选择 | 版本约束 |
|---|---|---|
| Runtime | Node.js | >= 20 LTS |
| 框架 | Next.js（App Router） | 15.x |
| 语言 | TypeScript | 5.x（strict 模式） |
| UI | shadcn/ui + Tailwind | Tailwind 3.4.x（v4 留作后续升级 slice） |
| 表单 | react-hook-form + zod | rhf 7.x / zod 3.x |
| YAML | js-yaml | 4.x |
| 单测 | Vitest | 2.x |
| E2E | Playwright | 1.x |
| Lint | ESLint + Prettier | ESLint 9.x flat config |

**所有依赖在 `package.json` 里写死精确版本号**（如 `"next": "15.0.3"`，不是 `"^15.0.0"`）。`package-lock.json` 必须提交。升级走单独 commit，commit message 要写清楚动机。

## 目录结构

```
spec-bridge/
├── CLAUDE.md / README.md / .gitignore / .env.example
├── package.json / package-lock.json / tsconfig.json
├── next.config.ts / tailwind.config.ts / eslint.config.mjs
├── vitest.config.ts / playwright.config.ts
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               # spec 列表/入口
│   │   └── editor/[id]/page.tsx   # spec 编辑器
│   ├── components/
│   │   ├── ui/                    # shadcn 组件
│   │   ├── spec-form/             # 录入表单
│   │   ├── lint-panel/            # spec 校验
│   │   └── exporters/             # 3 种导出
│   ├── lib/
│   │   ├── spec-schema.ts         # 核心抽象，见上
│   │   ├── exporters/
│   │   │   ├── prd-markdown.ts
│   │   │   ├── promptfoo-yaml.ts
│   │   │   └── json-spec.ts
│   │   ├── linter/
│   │   └── storage/               # localStorage 抽象
│   └── types/
├── tests/{unit,e2e}/
├── docs/spec-format.md            # spec 字段语义
└── examples/*.spec.json           # 内置示例
```

**约束**：
- `src/app/` 只放路由和页面，业务逻辑放 `src/lib/`
- `src/components/` 只做展示和事件分发，不直接读写 storage / 不调 API
- `src/lib/` 是纯函数为主，方便单测
- 组件命名 PascalCase，文件名 kebab-case（`spec-form/spec-form.tsx`）

## 代码风格

- **TypeScript strict**：`strict: true`、`noUncheckedIndexedAccess: true`
- **不用 `any`**：有真需要时用 `unknown` + 类型守卫，或者写 issue 说明为什么
- **组件函数式**：`export function MyComponent() { ... }`，不用 class component
- **导入顺序**：node 内置 → 第三方 → 项目内（按 `@/` 别名）
- **不写无意义注释**：好的命名比注释更可靠；只在解释"为什么"时写注释（不解释"做什么"）
- **错误处理在边界**：`src/lib/` 内部信任参数已校验，校验只在用户输入和外部接口处做（zod 解析）

## 测试要求

- **每个 `src/lib/` 函数都有单测**（Vitest）。`src/lib/exporters/*.ts` 必须覆盖：基本 case + 边界（空示例、特殊字符、变量未引用）
- **每个导出器有 1 个 E2E 测试**（Playwright）：从 UI 录入 → 触发下载 → 断言下载内容结构正确
- **不依赖外网的测试**：所有测试在 `npm test` 单命令下能跑通，不需要联网或本地起服务（Playwright 用 Next.js dev server 是允许的）
- 单测放 `tests/unit/`，E2E 放 `tests/e2e/`，文件名与被测对象对应（`promptfoo-yaml.test.ts`）

## Slice 完成定义

每个 vertical slice 必须同时满足：

1. **UI 端到端能跑**：在浏览器里走完该 slice 描述的用户路径
2. **TS 无错**：`npm run typecheck` 通过
3. **ESLint 无 warning**：`npm run lint` 干净
4. **至少 1 个单测**：覆盖该 slice 引入的核心逻辑
5. **1 个独立 commit**：commit message 写 slice 编号 + 一句话动机

切下一个 slice 前必须先确认上面 5 条都满足，不允许"半成品堆积"。

## Slice 顺序（详见 plan 文件）

0. 项目脚手架
1. 最简表单 + JSON 导出
2. **Promptfoo YAML 导出（杀手锏）**
3. Markdown PRD 导出
4. 实时 lint 面板
5. 多 spec 管理（localStorage）
6. 示例 spec 库（3 个内置）
7. 评估维度 → llm-rubric 自动转换

## Harness Engineering 实践

参考 [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/) 的范式：人写挽具（CLAUDE.md / 工具 / 模式约束），agent 写代码。

实践要求：
1. **CLAUDE.md 是 agent 的挽具**：规则不全/模糊时优先补这里，不要靠口头反复约定
2. **遇到 agent 反复犯错时，问"什么 capability 缺失"**：把缺失能力工具化（脚本、组件、reusable type），不要靠"再嘱咐一次"硬怼
3. **每个 slice 完成后写 1-2 句反思**：哪里高效、哪里要人手动补——记到 `docs/harness-notes.md`
4. **第二次重复一件事时，工具化它**：写脚本 / 写组件 / 扩 CLAUDE.md

## 启动

```bash
cd spec-bridge
npm install              # 安装锁定版本
npm run dev              # 起 Next.js dev server
npm run typecheck        # TS 类型检查
npm run lint             # ESLint
npm test                 # 单测 + E2E
npm run build            # 生产构建（部署前必须通过）
```

## 部署

Vercel：`git push` 自动 preview，main 分支自动 production。免费、零运维。

## 注意事项

- **localStorage 配额**：现代浏览器 5-10 MB，足够 MVP。设计时考虑 spec 体积（避免在 spec 内嵌大段示例文本）
- **SSR / CSR 边界**：localStorage 只能在客户端读，不要在 server component 里访问
- **package-lock.json 必须提交**：Lab/ 硬规则
- **路径用相对路径**（或 `@/` 别名）：不写绝对路径硬编码
