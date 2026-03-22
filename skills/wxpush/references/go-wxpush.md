# Go-WXPush API 文档 (hezhizheng/go-wxpush 项目)

对应 GitHub: [hezhizheng/go-wxpush](https://github.com/hezhizheng/go-wxpush)
支持部署方式: 源码编译、Docker

端点：`/wxsend`
支持方法：GET、POST

## 认证方式

**无 Token**，所有 wx 配置通过参数传递。

## 请求参数

| 参数 | 必填 | 说明 |
|------|------|------|
| title | **是** | 消息标题 |
| content | **是** | 消息内容 |
| appid | **是** | 微信 AppID |
| secret | **是** | 微信 AppSecret |
| userid | **是** | 接收用户 OpenID |
| template_id | **是** | 模板消息 ID |
| base_url | 否 | 跳转 URL |
| tz | 否 | 时区（默认 Asia/Shanghai） |

**重要：appid/secret/userid/template_id 没有默认值，每次调用都必须传。**

## GET 示例

```bash
curl "https://your-server.com:5566/wxsend?title=通知&content=消息内容&appid=xxx&secret=xxx&userid=openid1&template_id=xxx"
```

## POST 示例

```bash
curl -X POST "https://your-server.com:5566/wxsend" \
  -H "Content-Type: application/json" \
  -d '{"title":"通知","content":"消息内容","appid":"xxx","secret":"xxx","userid":"openid1","template_id":"xxx"}'
```

## 响应格式

成功：`{"errcode": 0}`
失败：返回相应的错误状态码和信息。
