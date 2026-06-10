# 配合 Cursor 执行

## mcp.json

新迁移的 PC 最好将 mcp.json 置为全局, 并开启 yolo 模式

## browser-tools-mcp

执行

```bash
npx @agentdeskai/browser-tools-server@latest
```

在 cursor 终端

## github mcp

主要用于 规范 commit 记录 ，快速 `PR` & 创建 `issue`

- [文档](https://github.com/github/github-mcp-server)

## Playwright MCP

┌─────────────────────────────────────────────────────────┐
│                    .cursor 目录                         │
├──────────────┬──────────────────────────────────────────┤
│  commands/   │  自动触发（按对话描述匹配）               │
│  (AI 行为脚本)│  不需要显式说明，如 "帮我简化代码"        │
├──────────────┼──────────────────────────────────────────┤
│  rules/      │  • alwaysApply: true → 始终生效          │
│  (AI 约束)   │  • globs: *.js → 打开特定文件时生效      │
│              │  • description: 关键词 → 提及关键词时生效  │
├──────────────┼──────────────────────────────────────────┤
│  skills/     │  1. 不会自动调用                            │
│  (知识库)    │  需要在描述中提及或显式指定  
               │ 2. Cursor 会根据 skill 的 description 
└──────────────┴──────────────────────────────────────────┘
