---
name: wxpush
description: "微信模板消息推送 skill。支持三种 wxpush API 格式：edgeone（默认）、wxpush（frankiejun 项目）、go-wxpush。使用场景：发送微信推送消息、配置 wxpush 环境。"
homepage: https://github.com/shisheng820/WXPush-edgeone
metadata: { "openclaw": { "emoji": "💬", "requires": { "bins": ["curl", "python3"] } } }
license: MIT-0
---

# WXPush Skill

微信模板消息推送，支持三种 API 格式切换（对应三个不同项目）。

## 配置

配置文件：`~/.config/wxpush/wxpush.env`

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

如配置文件不存在，引导用户创建：询问 mode、token、wx 配置等，写入 `~/.config/wxpush/wxpush.env` 并设权限 600。

配置完成后，**务必发送一条测试消息**以确认配置正确。

## 发送消息

读取 `~/.config/wxpush/wxpush.env`，根据 mode 选择 curl 或 Python 发送请求。

优先使用 curl（最简洁），不可用时用 Python（标准库，无需额外依赖）。

### edgeone 模式（默认）

```bash
# curl
curl -s -X POST "${WXPUSH_API_URL}/wxsend" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"标题\",\"content\":\"内容\",\"token\":\"${WXPUSH_API_TOKEN}\"}"

# Python（标准库，无需安装）
python3 -c "
import json, os, sys
from urllib.request import Request, urlopen
cfg = {k.strip(): v.strip() for k, _, v in (l.partition('=') for l in open(os.path.expanduser('~/.config/wxpush/wxpush.env')) if '=' in l and not l.startswith('#'))}
data = json.dumps({'title': sys.argv[1], 'content': sys.argv[2], 'token': cfg.get('WXPUSH_API_TOKEN','')}).encode()
req = Request(cfg.get('WXPUSH_API_URL','').rstrip('/') + '/wxsend', data=data, headers={'Content-Type':'application/json'})
print(urlopen(req, timeout=15).read().decode())
" "标题" "内容"
```

### wxpush 模式

```bash
# curl
curl -s -X POST "${WXPUSH_API_URL}/wxsend" \
  -H "Authorization: ${WXPUSH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"标题\",\"content\":\"内容\"}"

# Python
python3 -c "
import json, os, sys
from urllib.request import Request, urlopen
cfg = {k.strip(): v.strip() for k, _, v in (l.partition('=') for l in open(os.path.expanduser('~/.config/wxpush/wxpush.env')) if '=' in l and not l.startswith('#'))}
data = json.dumps({'title': sys.argv[1], 'content': sys.argv[2]}).encode()
req = Request(cfg.get('WXPUSH_API_URL','').rstrip('/') + '/wxsend', data=data, headers={'Content-Type':'application/json','Authorization':cfg.get('WXPUSH_API_TOKEN','')})
print(urlopen(req, timeout=15).read().decode())
" "标题" "内容"
```

### go-wxpush 模式

```bash
# curl
curl -s -X POST "${WXPUSH_API_URL}/wxsend" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"标题\",\"content\":\"内容\",\"appid\":\"${WXPUSH_APPID}\",\"secret\":\"${WXPUSH_SECRET}\",\"userid\":\"${WXPUSH_USERID}\",\"template_id\":\"${WXPUSH_TEMPLATE_ID}\"}"

# Python
python3 -c "
import json, os, sys
from urllib.request import Request, urlopen
cfg = {k.strip(): v.strip() for k, _, v in (l.partition('=') for l in open(os.path.expanduser('~/.config/wxpush/wxpush.env')) if '=' in l and not l.startswith('#'))}
data = json.dumps({'title': sys.argv[1], 'content': sys.argv[2], 'appid': cfg.get('WXPUSH_APPID',''), 'secret': cfg.get('WXPUSH_SECRET',''), 'userid': cfg.get('WXPUSH_USERID',''), 'template_id': cfg.get('WXPUSH_TEMPLATE_ID','')}).encode()
req = Request(cfg.get('WXPUSH_API_URL','').rstrip('/') + '/wxsend', data=data, headers={'Content-Type':'application/json'})
print(urlopen(req, timeout=15).read().decode())
" "标题" "内容"
```

## 三种 API 格式差异

| 特性 | edgeone | wxpush | go-wxpush |
|------|---------|--------|-----------|
| 对应项目 | [shisheng820/WXPush-edgeone](https://github.com/shisheng820/WXPush-edgeone) | [frankiejun/wxpush](https://github.com/frankiejun/wxpush) | [hezhizheng/go-wxpush](https://github.com/hezhizheng/go-wxpush) |
| 默认地址 | `https://wxpush.hunluan.space` | 无（自填） | `https://push.hzz.cool` |
| token | 可选 | **必填** | **无** |
| token 传递方式 | query / body / header | query / header | — |
| wx 配置 | 无 token 时必填 | 服务端有默认值 | **必填**（无默认值） |
| skin | 原生支持 | 需配合 wxpushSkin | 需配合 wxpushSkin |
| 独有参数 | — | — | `tz`（时区） |
| 成功响应 | 标准微信响应 | `{msg: "Successfully sent..."}` | `{errcode: 0}` |

### mode 选择指南

- **edgeone**：默认地址 `https://wxpush.hunluan.space`，支持有/无 token 两种方式
- **wxpush**：需自填服务地址，必须配置 token，wx 配置在服务端
- **go-wxpush**：默认地址 `https://push.hzz.cool`，无 token，每次调用必须传完整 wx 配置

## 详细 API 文档

根据用户选择的 mode，加载对应 reference 文件：

- edgeone → [references/edgeone.md](references/edgeone.md)
- wxpush → [references/wxpush.md](references/wxpush.md)
- go-wxpush → [references/go-wxpush.md](references/go-wxpush.md)

## 皮肤列表（edgeone 原生支持）

MacOS_Hacker_Theme-LGT、aurora-glass、cyberpunk、hacker-dark、minimalist-light、ocean-breeze、quiet-night、sakura、sunset-glow、terminal-neon、warm-magazine

## 安全提示

- 默认端点（`wxpush.hunluan.space`、`push.hzz.cool`）为第三方服务，AppID/Secret/Token 会发送至对应服务
- 如不信任默认端点，请自行部署服务并设置 `WXPUSH_API_URL`
- 配置文件权限建议设为 600（仅当前用户可读写）
