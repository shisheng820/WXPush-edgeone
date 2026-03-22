# EdgeOne API 文档

对应 GitHub: [shisheng820/WXPush-edgeone](https://github.com/shisheng820/WXPush-edgeone)
支持部署方式: EdgeOne 等

端点：`/wxsend`
支持方法：GET、POST

## 认证方式

edgeone 支持两种认证，二选一：

### 方式一：Token 认证

token 可通过以下任一方式传递：
- URL query: `?token=xxx`
- JSON body: `{"token": "xxx"}`
- Authorization header: `Authorization: xxx`

此时 appid/secret/userid/template_id 均为可选覆盖。

### 方式二：无 Token，提供完整 wx 配置

不传 token，必须提供：
- `appid` — 微信 AppID
- `secret` — 微信 AppSecret
- `userid` — 接收用户 OpenID（`|` 分隔多用户）
- `template_id` — 模板消息 ID

## 请求参数

| 参数 | 必填 | 说明 |
|------|------|------|
| token | 否 | API Token（与 wx 配置二选一） |
| title | 是 | 消息标题 |
| content | 是 | 消息内容 |
| appid | 否 | 微信 AppID（无 token 时必填） |
| secret | 否 | 微信 AppSecret（无 token 时必填） |
| userid | 否 | 接收用户 OpenID（无 token 时必填） |
| template_id | 否 | 模板 ID（无 token 时必填） |
| skin | 否 | 皮肤名称（edgeone 原生支持） |
| base_url | 否 | 跳转 URL |

## GET 示例

```bash
# Token 模式
curl "https://your-edgeone.com/wxsend?token=xxx&title=通知&content=消息内容"

# 无 Token 模式
curl "https://your-edgeone.com/wxsend?appid=xxx&secret=xxx&userid=openid1&template_id=xxx&title=通知&content=消息内容&skin=warm-magazine"
```

## POST 示例

```bash
# Token 模式
curl -X POST "https://your-edgeone.com/wxsend" \
  -H "Content-Type: application/json" \
  -d '{"token":"xxx","title":"通知","content":"消息内容"}'

# 无 Token 模式
curl -X POST "https://your-edgeone.com/wxsend" \
  -H "Content-Type: application/json" \
  -d '{"appid":"xxx","secret":"xxx","userid":"openid1","template_id":"xxx","title":"通知","content":"消息内容"}'
```

## 响应格式

标准微信模板消息响应。
