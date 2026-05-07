# spec-bridge

状态：[active]

## 一句话描述它做什么

让 AI 产品经理用一份"结构化需求表"，一键生成可读的 PRD、可被工具消费的 JSON、还有能直接跑测试的 Promptfoo 配置文件——把"我想做个 AI 功能"和"我能不能验证它真的做对了"接起来。

## 它解决的问题

- 现有 PRD 工具（Notion、Copilot4DevOps）输出的是死的 markdown 文档，没法验证。
- 现有 LLM 测试工具（Promptfoo / DeepEval / Braintrust）都对工程师友好、对 PM 不友好。
- 2026 年 3 月 OpenAI 收购了 Promptfoo，中立的 PM 友好前置入口出现真空。

spec-bridge 占的就是这个真空——**让 PM 写的需求从一开始就可以被验证**。

## 快速开始

```bash
# 安装依赖（已锁定版本）
npm install

# 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:3000

# 跑测试
npm test
```

## 核心使用流程

1. 在网页上填一份 spec：功能名 / 描述 / prompt 模板 / 示例 / 评估维度
2. 实时 lint 帮你检查：变量没引用？示例没覆盖？评估维度太模糊？
3. 三个按钮三种导出：
   - 📄 **PRD（markdown）**——发给同事看
   - 🔧 **JSON**——给后续工具读
   - ⚙️ **Promptfoo YAML**——直接 `npx promptfoo eval -c spec.yaml` 跑测试

## 示例

```yaml
# 一个邮件分类的 spec 导出后长这样
description: classify customer emails into priority buckets
prompts:
  - "你是邮件分类助手。邮件内容：{{email}}\n请输出 high/medium/low。"
providers:
  - openai:gpt-4o-mini
tests:
  - vars:
      email: "我的订单还没发货，已经一周了！"
    assert:
      - type: equals
        value: high
  - vars:
      email: "请问发票什么时候开？"
    assert:
      - type: llm-rubric
        value: 应该输出 medium 或 low
```

执行 `npx promptfoo eval -c email-classifier.yaml`，看到测试 pass / fail。

## 不做的事

- ❌ 账号系统 / 团队协作（MVP 单机用）
- ❌ Production tracing（不是这个工具的角色）
- ❌ 自动 prompt 优化（DSPy / Adaline 在做）
- ❌ 模型代理（用户走自己的 API key）

## 项目状态

MVP 开发中。完整开发计划见 `CLAUDE.md`。

## 部署

本地跑 `npm run dev`；生产部署 Vercel 一键。
