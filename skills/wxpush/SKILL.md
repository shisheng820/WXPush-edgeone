---
name: wxpush
description: |
  微信模板消息推送 skill。支持三种 wxpush API 格式：edgeone（默认）、wxpush（frankiejun 项目）、go-wxpush。
  使用场景：发送微信推送消息、配置 wxpush 环境、切换 API 模式。
  触发条件：用户提到 wxpush、微信推送、推送消息。
---

# WXPush Skill

微信模板消息推送，支持三种 API 格式切换（对应三个不同项目）。

## 快速开始

### 1. 配置

读取 `~/.config/wxpush/wxpush.env`（如不存在，运行 `scripts/wxpush-init.sh` 引导创建）。

配置字段：

```bash
WXPUSH_API_URL=https://your-service.com    # 服务地址
WXPUSH_API_TOKEN=your_token                # API Token（edgeone 可选，wxpush 必填，go-wxpush 留空）
WXPUSH_MODE=edgeone                        # API 模式: edgeone | wxpush | go-wxpush
WXPUSH_APPID=wx_appid                      # 微信 AppID（go-wxpush 必填）
WXPUSH_SECRET=wx_secret                    # 微信 Secret（go-wxpush 必填）
WXPUSH_USERID=openid1|openid2              # 默认接收用户
WXPUSH_TEMPLATE_ID=template_id             # 模板 ID
WXPUSH_SKIN=                               # 皮肤（可选，edgeone 原生支持）
WXPUSH_BASE_URL=                           # 跳转 URL（可选）
```

### 2. 验证配置

配置完成后，**务必发送一条测试消息**以确认配置正确：

```bash
bash ~/.config/opencode/skills/wxpush/scripts/wxpush.sh --title "配置测试" --content "如果收到此消息，说明 wxpush 配置成功 ✅"
```

如果收到消息，说明配置生效；如果返回错误，请检查 token、API 地址等配置项。

### 3. 发送消息

```bash
bash ~/.config/opencode/skills/wxpush/scripts/wxpush.sh --title "标题" --content "内容"
```

所有参数均可通过命令行临时覆盖：`--appid` `--secret` `--userid` `--template_id` `--skin` `--token` 等。

## 三种 API 格式差异

三个 mode 对应三个 GitHub 项目的 API 格式，不是部署方式的区别（三个项目都支持 Docker/源码部署）。

| 特性 | edgeone | wxpush | go-wxpush |
|------|---------|--------|-----------|
| 对应项目 | [shisheng820/WXPush-edgeone](https://github.com/shisheng820/WXPush-edgeone) | [frankiejun/wxpush](https://github.com/frankiejun/wxpush) | [hezhizheng/go-wxpush](https://github.com/hezhizheng/go-wxpush) |
| token | 可选 | **必填** | **无** |
| token 传递方式 | query / body / header | query / header | — |
| appid/secret/userid/template_id | 无 token 时必填 | 可选（服务端有默认值） | **必填**（无默认值） |
| POST 鉴权 | body 或 header | header | 无 |
| skin | 原生支持 | 需配合 wxpushSkin | 需配合 wxpushSkin |
| 独有参数 | — | — | `tz`（时区） |
| 成功响应 | 标准微信响应 | `{msg: "Successfully sent..."}` | `{errcode: 0}` |

### mode 选择指南

- **edgeone**：[shisheng820/WXPush-edgeone](https://github.com/shisheng820/WXPush-edgeone)，默认地址 `https://wxpush.hunluan.space`，支持有/无 token 两种方式
- **wxpush**：[frankiejun/wxpush](https://github.com/frankiejun/wxpush)，需自填服务地址，必须配置 token，wx 配置在服务端
- **go-wxpush**：[hezhizheng/go-wxpush](https://github.com/hezhizheng/go-wxpush)，默认地址 `https://push.hzz.cool`，无 token，每次调用必须传完整 wx 配置

## 详细 API 文档

根据用户选择的 mode，加载对应 reference 文件：

- edgeone → [references/edgeone.md](references/edgeone.md)
- wxpush → [references/wxpush.md](references/wxpush.md)
- go-wxpush → [references/go-wxpush.md](references/go-wxpush.md)

## 脚本说明

- `scripts/wxpush.sh` — 发送消息，自动读取 env 配置，支持参数覆盖
- `scripts/wxpush-init.sh` — 交互式引导创建 wxpush.env
