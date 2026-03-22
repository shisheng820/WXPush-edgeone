# Wxpush API 文档 (frankiejun/wxpush 项目)

对应 GitHub: [frankiejun/wxpush](https://github.com/frankiejun/wxpush)
支持部署方式: Cloudflare Workers、Docker

端点：`/wxsend`
支持方法：GET、POST

## 认证方式

**Token 必填**，可通过以下方式传递：
- URL query: `?token=xxx`
- Authorization header: `Authorization: xxx`

## 请求参数

| 参数 | 必填 | 说明 |
|------|------|------|
| token | **是** | API Token |
| title | 是 | 消息标题 |
| content | 是 | 消息内容 |
| appid | 否 | 临时覆盖默认微信 AppID |
| secret | 否 | 临时覆盖默认微信 AppSecret |
| userid | 否 | 临时覆盖默认接收用户 |
| template_id | 否 | 临时覆盖默认模板 ID |
| base_url | 否 | 临时覆盖默认跳转 URL |

注意：appid/secret/userid/template_id 均在服务端配置了默认值，API 调用时只需 token + title + content。

## GET 示例

```bash
curl "https://your-worker.com/wxsend?token=your_token&title=通知&content=消息内容"
```

## POST 示例

```bash
curl -X POST "https://your-worker.com/wxsend" \
  -H "Authorization: your_token" \
  -H "Content-Type: application/json" \
  -d '{"title":"通知","content":"消息内容"}'
```

## 响应格式

成功：
```json
{"msg": "Successfully sent messages to 1 user(s). First response: ok"}
```

失败：
```json
{"msg": "Invalid token"}
```

## 皮肤

skin 不是原生 API 参数。如需换肤，需部署 [wxpushSkin](https://github.com/frankiejun/wxpushSkin) 配合使用。
