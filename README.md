# WXPush - 极简微信消息推送服务 & Web 测试台

WXPush 是一个轻量级、完全开源的微信公众号模板消息推送服务。它不仅提供简单易用的 HTTP API 供脚本和程序调用，还自带一个基于 **Material Design 3** 打造的现代沉浸式 Web 测试控制台。

无论是集成自动化通知，还是临时体验微信发信推送，WXPush 都能为你提供既优雅又高效的解决方案。

## 🌐 在线演示

你可以直接访问已经部署好的公开站点体验 WXPush 的功能：

**[https://wxpush.hunluan.space](https://wxpush.hunluan.space)**


## ✨ 核心特性

- 🎯 **开箱即用的测试控制台**：自带精美前端交互界面，完全响应式排版。
- 🎨 **11 套高颜值卡片皮肤**：内置赛博朋克、macOS 极客、极光玻璃等 11 款通知卡片皮肤，在 Web 侧可**毫秒级无缝缩放预览**真实效果。
- 💽 **安全存储**：首创前端 `localStorage` 配置驻留与即时双向数据流校验，保护隐私与便利并重。
- 🛠️ **多协议 API 支持**：完美支持 GET / POST / Webhook 形式的脚本调用发送。
- 👥 **灵活的用户管理**：支持单发或多发给不同的微信受体（`userid` 用 `|` 分隔）。
- ⚡ **超低成本的高性能架构**：专门针对腾讯云 **EdgeOne Pages** 和 **Cloudflare Pages/Workers** 调整。路由请求纯前端静态托管，API 指令精准调用 Serverless 函数，避免每一次点击产生额外计费额度！

## 🚀 极速部署 (以 EdgeOne 为例)

本项目没有任何繁杂的构建动作（0 build payload），可以直接一键免费部署至腾讯云 EdgeOne Pages。

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fshisheng820%2FWXPush-edgeone&project-name=wxpush-edgeone&output-directory=.&env=API_TOKEN%2CWX_APPID%2CWX_SECRET%2CWX_USERID%2CWX_TEMPLATE_ID%2CWX_BASE_URL%2CWX_SKIN&env-description=%E8%AF%B7%E5%A1%AB%E5%86%99%E5%BE%AE%E4%BF%A1%E6%8E%A8%E9%80%81%E7%9B%B8%E5%85%B3%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)

部署所需环境变量详情见下方 *[⚙️ 环境变量设置]* 章节。如果你使用 Cloudflare Pages 或 Workers，逻辑与部署步骤完全一致，仅需保证项目的构建输出目录设为默认根目录 `.` 即可。

## ⚙️ 环境变量设置

后端 Serverless 系统可通过平台（EdgeOne/Cloudflare）的控制面板设置环境变量读取：

**必填项（系统 API 推送所需）：**
- `API_TOKEN`：你的专属调用密钥（Web主页登录鉴权以及外部接口请求使用）。
- `WX_APPID`：对应微信测试号/公众平台的 AppID。
- `WX_SECRET`：对应测试号的 AppSecret 密钥。
- `WX_USERID`：默认接收消息的微信用户 OpenID（如果是群发或多接收者，请用 `|` 隔开）。
- `WX_TEMPLATE_ID`：申请好的微信测试模板消息 ID（内容规定为两行，上填 `{{title.DATA}}` 注释，下填 `{{content.DATA}}`）。

**可选项：**
- `WX_SKIN`：定义在没有传 base_url 的时候默认走哪个内置皮肤跳转面，若没填默认为温润如玉的 `warm-magazine` 风格。
- `WX_BASE_URL`：强制重定向。如果设定此变量，当微信终端收到卡片点击时跳过原生内嵌的精美皮肤页，直接跳向你这个自定义链接。

## 🖥 Web 测试控制台体验 (Public Feature)

你部署该项目后，用任意现代浏览器直接访问根域名（例如 `https://<你的域名>/`），即可启动 **WXPush 的前端交互测试台**。这不仅仅是一个管理员页面，更是一个极度适合用来推广调试发包平台的交互看板！

* **向导教程内建**：右侧提供保姆级的微信测试号开通教程，即使是纯小白，展开面板后都能顺着五步指引拿到自己专属的发消息全套账号密码。
* **快捷鉴权与隐私保护体验**：如果输入了配置里面的系统级的 `API_TOKEN` 并验证通过，剩余四项微信账号底层密码就不用重复键入，系统会自动找环境变量帮你兜底发包！同样，作为对外公开服务，如果使用者没有此项最高通行证，系统会在本地严格阻塞它，强制他手动输入他自己的那四项密钥才能请求后端的 Serverless Webhook。服务端代码承诺完全开源并且不会有任何收集存储访客密钥隐私的行为！

## 🔌 API 接入指南 (编程与脚本场景)

不论你采用哪种 HTTP 报文，外部自动化程序一律**唯一**请求以下 API（即根域名后面追加 `/wxsend`）：

> URL endpoint: `https://<你的域名>/wxsend`

### 1. 通信参数说明

| 参数名 | 数据类型 | 是否必传 | 详情描述解读 |
|---|---|---|---|
| `token` | String | 是* | 系统配置的主 `API_TOKEN`。你可以在 URL query 带上 `?token=xxx`，可以在请求体 JSON 的 `token` 字典带上，也可使用通用的强授权协议携带（加在 `Header` 为 `Authorization: Bearer <你的Token>` ）。*注意：如果未传此项，则系统要求后续所有的覆盖型参数全被传值。* |
| `title` | String | **是** | 需推送的消息标题文本。 |
| `content` | String | **是** | 需推送的核心内容文本，使用原生的 `\n` 进行常规换行。 |
| `userid` | String | 否 | 动态覆盖：特定接收者的 OpenID 集合。 |
| `appid` | String | 否 | 动态覆盖：该单独请求采用的 AppID。 |
| `secret` | String | 否 | 动态覆盖：该单独请求采用的 AppSecret。 |
| `template_id` | String | 否 | 动态覆盖：该请求触发专用的模板 ID。 |
| `skin` | String | 否 | 动态覆盖发包跳出页面皮肤：共 11 个合法字符串 (`cyberpunk` 等)。 |
| `base_url` | String | 否 | 动态覆盖：直接跳去该链接地址，跳过 WXPush 生成的精美皮肤阅读通知页面。 |

### 2. 发起调用方式

**🟢 简易 GET 请求（适合浏览器快捷调用或者轻量级 Shell）：**
```text
https://<你的域名>/wxsend?token=你的Token&title=服务告警&content=CPU使用率超过90%
```

**🔵 标准 POST 与 Webhook 强范式请求（适合主流应用/系统集成）：**
```bash
curl -X POST "https://<你的域名>/wxsend" \
  -H "Authorization: 你的Token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "备份完成提醒",
    "content": "今日数据库自动备份已成功通过校验并上传至云端冷库存储。"
  }'
```

### 3. API 返回状态码机制
系统拥有极其严格标准的 HTTP 返回体系与 JSON Error Trace 抛出：
* `HTTP 200`：即刻推送成功，Response JSON 将包含所采用的 `skin` 美化类别和成功拼接的长路径 `jump_url`。
* `HTTP 400`：强类型约束拦截提示，如不带 token 也没填完自身微信号体系或者没有携带关键必须字段 content/title。
* `HTTP 403`：安全防护，请求者如果非要尝试携带 Token 但未配对通过。
* `HTTP 500`：Server 后端透传了腾讯微信接口产生的各类错误。极大概率因为获取微信 Access Token 失败（IP 白名单限制未关等因素，参照下文提示）。

## 💡 微信公众号 IP 白名单

微信官方对于正式注册运营身份的 **“服务号 / 认证订阅公众号”** 有极度严苛的服务后端 **IP 白名单约束机制**。Serverless 体系如 EdgeOne/Cloudflare Workers，其网络下发流转使用的是一整个大集群的动态公网 IP 簇，如果你绑定正式号的 AppID/Secret，在请求 Access Token 时很大概率报错触发微信异常码 `40164 (invalid ip)` 进而抛出 500。

**针对非企业强绑定类使用者，我们非常强烈的建议：直接使用控制台指引去调用并配置完全不受白名单限制影响的、专属于开发者个人的 [微信公众平台接口开放测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandboxinfo?action=showinfo&t=sandbox/index) 进行长远的通知挂载。**

## 👨‍💻 开源与致谢

本着拥抱社区原则，遵循完全宽松的 **MIT 协议** 释出完整方案栈代码。

**致谢名单（Acknowledge）：**
项目由最初的 Golang 工具链雏形受启发，并经历 JS 重构与彻底的 UI 变革而成。在此向如下优秀的旧时轮子库与贡献致谢：
- 核心参考衍生 [frankiejun/wxpush](https://github.com/frankiejun/wxpush)
- 协议及设计逻辑溯源 [hezhizheng/go-wxpush](https://github.com/hezhizheng/go-wxpush)

无论是提 PR 重构代码缩减性能，还是发现提报 Issue 缺陷，我们随时欢迎社区极客同好们的反馈交流！
