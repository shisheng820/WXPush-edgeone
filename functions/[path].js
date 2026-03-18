// NEW: Helper function to extract parameters from any request type
async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());

  let bodyParams = {};
  // Only try to parse a body if it's a POST/PUT/PATCH request
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json();
        // jsonBody can be a string, an object, or other types
        if (typeof jsonBody === 'string') {
          // treat raw string as content
          bodyParams = { content: jsonBody };
        } else if (jsonBody && typeof jsonBody === 'object') {
          // support nested containers like { params: {...} } or { data: {...} }
          if (jsonBody.params && typeof jsonBody.params === 'object') {
            bodyParams = jsonBody.params;
          } else if (jsonBody.data && typeof jsonBody.data === 'object') {
            bodyParams = jsonBody.data;
          } else {
            bodyParams = jsonBody;
          }
        }
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        bodyParams = Object.fromEntries(formData.entries());
      } else {
        // Fallback: try to read raw text and parse as JSON, otherwise treat as raw content
        const text = await request.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
              if (parsed.params && typeof parsed.params === 'object') {
                bodyParams = parsed.params;
              } else if (parsed.data && typeof parsed.data === 'object') {
                bodyParams = parsed.data;
              } else {
                bodyParams = parsed;
              }
            } else {
              bodyParams = { content: text };
            }
          } catch (e) {
            bodyParams = { content: text };
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse request body:', error);
      // Ignore body parsing errors and proceed with URL params
    }
  }

  // Merge params, giving body parameters precedence over URL parameters
  return { ...urlParams, ...bodyParams };
}

const SKINS = {
  classic: {
    name: '经典卡片',
    slug: 'classic',
    route: '/skins/classic/index.html',
  },
  night: {
    name: '静谧的夜空',
    slug: 'night',
    route: '/skins/night/index.html',
  },
  hacker: {
    name: 'MacOS Hacker',
    slug: 'hacker',
    route: '/skins/hacker/index.html',
  },
};

const DEFAULT_SKIN_KEY = 'classic';

function getSkinByKey(skinKey) {
  const key = (skinKey || '').toString().trim().toLowerCase();
  return SKINS[key] || SKINS[DEFAULT_SKIN_KEY];
}

function getOrigin(url) {
  return `${url.protocol}//${url.host}`;
}

function appendAccessQuery(url, sourceUrl) {
  try {
    const source = new URL(sourceUrl.toString());
    const target = new URL(url);
    const eoToken = source.searchParams.get('eo_token');
    const eoTime = source.searchParams.get('eo_time');

    if (eoToken && !target.searchParams.has('eo_token')) {
      target.searchParams.set('eo_token', eoToken);
    }
    if (eoTime && !target.searchParams.has('eo_time')) {
      target.searchParams.set('eo_time', eoTime);
    }

    return target.toString();
  } catch (error) {
    return url;
  }
}

function buildSkinLink(baseUrl, skin, url) {
  const raw = baseUrl && typeof baseUrl === 'string' && baseUrl.trim()
    ? baseUrl.trim()
    : `${getOrigin(url)}${skin.route}`;

  return appendAccessQuery(raw, url);
}

function renderSkinHtml(theme) {
  if (theme === 'night') {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title id="pageTitle">消息推送</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Noto Sans SC", "Segoe UI", sans-serif;
        background: radial-gradient(circle at 20% 20%, #1f2a44 0%, #070b15 55%, #03050a 100%);
        color: #e5ecff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .card {
        width: min(760px, 100%);
        border-radius: 24px;
        border: 1px solid rgba(164, 194, 255, 0.22);
        background: linear-gradient(160deg, rgba(16, 24, 44, 0.85), rgba(8, 13, 26, 0.9));
        box-shadow: 0 22px 60px rgba(4, 8, 18, 0.65);
        overflow: hidden;
      }
      .header {
        padding: 28px 28px 20px;
        background: linear-gradient(120deg, rgba(72, 110, 255, 0.28), rgba(72, 110, 255, 0));
        border-bottom: 1px solid rgba(164, 194, 255, 0.2);
      }
      .title {
        margin: 0;
        font-size: clamp(24px, 5vw, 34px);
        letter-spacing: 0.04em;
      }
      .body {
        padding: 24px 28px 28px;
      }
      .label {
        margin: 0 0 8px;
        color: #9eb1de;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .content {
        margin: 0;
        font-size: 17px;
        line-height: 1.8;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .foot {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px dashed rgba(164, 194, 255, 0.3);
        color: #a6b8e6;
        font-size: 14px;
      }
      @media (max-width: 640px) {
        .header, .body {
          padding: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1 id="title" class="title">消息推送</h1>
      </div>
      <div class="body">
        <p class="label">MESSAGE</p>
        <p id="message" class="content">无告警信息</p>
        <div class="foot">
          <span id="date">无时间信息</span>
        </div>
      </div>
    </div>
    <script>
      const p = new URLSearchParams(window.location.search);
      const title = p.get('title') || '消息推送';
      const message = p.get('message') || '无告警信息';
      const date = p.get('date') || '无时间信息';
      document.getElementById('pageTitle').textContent = title;
      document.getElementById('title').textContent = title;
      document.getElementById('message').textContent = message;
      document.getElementById('date').textContent = date;
    </script>
  </body>
</html>`;
  }

  if (theme === 'hacker') {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title id="pageTitle">消息推送</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: #030805;
        color: #79ffa8;
        font-family: "Cascadia Code", "Consolas", monospace;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .terminal {
        width: min(860px, 100%);
        border: 1px solid #1d7f43;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(46, 212, 112, 0.2);
      }
      .bar {
        padding: 10px 14px;
        background: #041109;
        border-bottom: 1px solid #1d7f43;
        font-size: 13px;
        color: #50d684;
      }
      .screen {
        padding: 18px;
        background: linear-gradient(180deg, rgba(5, 18, 11, 0.95), rgba(1, 10, 5, 0.98));
      }
      .line {
        margin: 0 0 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .muted {
        color: #4db578;
      }
    </style>
  </head>
  <body>
    <div class="terminal">
      <div class="bar">wxpush://notification</div>
      <div class="screen">
        <p class="line">$ TITLE: <span id="title">消息推送</span></p>
        <p class="line">$ MESSAGE:</p>
        <p id="message" class="line">无告警信息</p>
        <p class="line muted">$ DATE: <span id="date">无时间信息</span></p>
      </div>
    </div>
    <script>
      const p = new URLSearchParams(window.location.search);
      const title = p.get('title') || '消息推送';
      const message = p.get('message') || '无告警信息';
      const date = p.get('date') || '无时间信息';
      document.getElementById('pageTitle').textContent = title;
      document.getElementById('title').textContent = title;
      document.getElementById('message').textContent = message;
      document.getElementById('date').textContent = date;
    </script>
  </body>
</html>`;
  }

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title id="pageTitle">消息推送</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Noto Sans SC", "Segoe UI", sans-serif;
        background: linear-gradient(160deg, #f8fbff 0%, #ebf4ff 100%);
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .card {
        width: min(760px, 100%);
        border-radius: 20px;
        background: #fff;
        border: 1px solid #dbe8ff;
        box-shadow: 0 16px 40px rgba(43, 72, 136, 0.14);
        overflow: hidden;
      }
      .header {
        padding: 24px;
        background: linear-gradient(120deg, #2f80ed, #56ccf2);
        color: #fff;
      }
      .title {
        margin: 0;
        font-size: clamp(24px, 5vw, 34px);
      }
      .body {
        padding: 24px;
      }
      .content {
        margin: 0;
        line-height: 1.8;
        font-size: 17px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .date {
        margin-top: 20px;
        color: #5b6b88;
        font-size: 14px;
      }
      @media (max-width: 640px) {
        .header, .body {
          padding: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1 id="title" class="title">消息推送</h1>
      </div>
      <div class="body">
        <p id="message" class="content">无告警信息</p>
        <div class="date" id="date">无时间信息</div>
      </div>
    </div>
    <script>
      const p = new URLSearchParams(window.location.search);
      const title = p.get('title') || '消息推送';
      const message = p.get('message') || '无告警信息';
      const date = p.get('date') || '无时间信息';
      document.getElementById('pageTitle').textContent = title;
      document.getElementById('title').textContent = title;
      document.getElementById('message').textContent = message;
      document.getElementById('date').textContent = date;
    </script>
  </body>
</html>`;
}


export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);


  // If path is a single segment like '/<token>', serve an interactive test page
  // but ignore reserved paths like '/wxsend', '/index.html', and '/skin/*'
  const singleSeg = url.pathname.match(/^\/([^\/]+)\/?$/);
  if (
    singleSeg &&
    singleSeg[1] &&
    singleSeg[1] !== 'wxsend' &&
    singleSeg[1] !== 'index.html' &&
    singleSeg[1] !== 'skin'
  ) {
    const rawTokenFromPath = singleSeg[1];

    // 1. Authenticate the token first
    if (rawTokenFromPath !== env.API_TOKEN) {
      const responseBody = { msg: 'Invalid token' };
      return new Response(JSON.stringify(responseBody), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // 2. Sanitize the token for safe embedding into HTML value attributes
    const sanitizedToken = rawTokenFromPath
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush 测试页面</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
        box-sizing: border-box;
      }
      .container {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 100%;
        text-align: left;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .container:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hint {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
      }
      label {
        display: block;
        margin: 16px 0 8px;
        font-weight: 700;
        color: #374151;
      }
      input[type=text], textarea, select {
        width: 100%;
        padding: 12px;
        border: 1px solid #d4d4d8;
        border-radius: 12px;
        background: #f4f4f5;
        transition: all 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
      }
      input[type=text]:focus, textarea:focus, select:focus {
        outline: none;
        border-color: #8b5cf6;
        background: #ffffff;
        box-shadow: 0 0 0 2px #c4b5fd;
      }
      button {
        margin-top: 24px;
        padding: 12px 20px;
        border-radius: 12px;
        border: 0;
        background: #8b5cf6;
        color: #fff;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      button:hover {
        background: #7c3aed;
        transform: translateY(-2px);
      }
      button#clearBtn {
         background: #f4f4f5;
         color: #374151;
         border: 1px solid #e4e4e7;
      }
       button#clearBtn:hover {
         background: #ffffff;
         border-color: #d4d4d8;
         color: #1f2937;
      }
      pre {
        background: #1f2937;
        color: #e5e7eb;
        padding: 16px;
        border-radius: 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .skin-preview {
        margin-top: 8px;
        font-size: 13px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WXPush 测试页面</h1>
      <p class="hint">当前 token (来自路径)：<strong>${sanitizedToken}</strong></p>

      <form id="testForm" method="POST" action="/wxsend">

        <label for="title">标题 (title)</label>
        <input id="title" name="title" type="text" value="测试标题" />

        <label for="content">内容 (content)</label>
        <textarea id="content" name="content" rows="4">这是测试内容</textarea>

        <label for="userid">用户 ID (userid，可选，多用户用 | 分隔)</label>
        <input id="userid" name="userid" type="text" placeholder="例如: OPENID1|OPENID2" />

        <label for="appid">WX_APPID (可选，留空使用环境变量)</label>
        <input id="appid" name="appid" type="text" />

        <label for="secret">WX_SECRET (可选，留空使用环境变量)</label>
        <input id="secret" name="secret" type="text" />

        <label for="template_id">模板 ID (template_id，可选)</label>
        <input id="template_id" name="template_id" type="text" />

        <label for="skin">内置皮肤 (skin，可选)</label>
        <select id="skin" name="skin">
          <option value="classic">经典卡片</option>
          <option value="night">静谧的夜空</option>
          <option value="hacker">MacOS Hacker</option>
        </select>
        <div id="skinPreview" class="skin-preview"></div>

        <label for="base_url">跳转链接 base_url (可选，留空将使用上方皮肤)</label>
        <input id="base_url" name="base_url" type="text" />

        <input type="hidden" name="token" id="hiddenToken" value="${sanitizedToken}" />

        <div style="display:flex;gap:12px;align-items:center">
          <button id="sendBtn" type="submit">发送测试请求</button>
          <button type="button" id="clearBtn">清空</button>
        </div>
      </form>
      <div id="responseCard" style="display:none; margin-top: 20px;">
        <label for="responseArea">响应</label>
        <pre id="responseArea"></pre>
      </div>
    </div>

    <script>
      const form = document.getElementById('testForm');
      const sendBtn = document.getElementById('sendBtn');
      const clearBtn = document.getElementById('clearBtn');
      const responseArea = document.getElementById('responseArea');
      const responseCard = document.getElementById('responseCard');
      const skinSelect = document.getElementById('skin');
      const skinPreview = document.getElementById('skinPreview');
      const baseUrlInput = document.getElementById('base_url');

      const skinRouteMap = {
        classic: '/skins/classic/index.html',
        night: '/skins/night/index.html',
        hacker: '/skins/hacker/index.html'
      };

      function withAccessQuery(rawUrl) {
        try {
          const source = new URL(window.location.href);
          const target = new URL(rawUrl, window.location.origin);
          const eoToken = source.searchParams.get('eo_token');
          const eoTime = source.searchParams.get('eo_time');

          if (eoToken && !target.searchParams.has('eo_token')) {
            target.searchParams.set('eo_token', eoToken);
          }
          if (eoTime && !target.searchParams.has('eo_time')) {
            target.searchParams.set('eo_time', eoTime);
          }

          return target.toString();
        } catch (error) {
          return rawUrl;
        }
      }

      function updateSkinPreview() {
        if (!skinSelect || !skinPreview) return;
        const selected = skinSelect.value || 'classic';
        const route = skinRouteMap[selected] || '/skins/classic/index.html';
        skinPreview.textContent = '皮肤链接: ' + withAccessQuery(window.location.origin + route);
      }

      if (form && sendBtn && clearBtn && responseArea && responseCard) {
        updateSkinPreview();
        if (skinSelect) {
          skinSelect.addEventListener('change', updateSkinPreview);
        }

        clearBtn.addEventListener('click', () => {
          document.getElementById('title').value = '';
          document.getElementById('content').value = '';
          document.getElementById('userid').value = '';
          document.getElementById('appid').value = '';
          document.getElementById('secret').value = '';
          document.getElementById('template_id').value = '';
          document.getElementById('skin').value = 'classic';
          document.getElementById('base_url').value = '';
          updateSkinPreview();
          responseArea.textContent = '';
          responseCard.style.display = 'none';
        });

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          sendBtn.disabled = true;
          const originalText = sendBtn.textContent;
          sendBtn.textContent = '发送中...';
          responseCard.style.display = 'none';

          const formData = new FormData(form);
          const payload = {};
          for (const [k, v] of formData.entries()) {
             if (k !== 'token' && v) {
                payload[k] = v;
             }
          }

          if (!payload.base_url) {
            const selected = (payload.skin || 'classic').toLowerCase();
            const route = skinRouteMap[selected] || '/skins/classic/index.html';
            payload.base_url = withAccessQuery(window.location.origin + route);
          }

          try {
            const headers = { 'Content-Type': 'application/json' };
            const token = document.getElementById('hiddenToken').value;
            if (token) headers['Authorization'] = token;

            const response = await fetch('/wxsend', { method: 'POST', headers, body: JSON.stringify(payload) });
            const responseText = await response.text();
            responseArea.textContent = 'Status: ' + response.status + '\\n\\n' + responseText;
            responseCard.style.display = 'block';
          } catch (err) {
            responseArea.textContent = 'Fetch error: ' + err.message;
            responseCard.style.display = 'block';
          } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
          }
        });
      }
    </script>
  </body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // Route: only handle message sending on '/wxsend'
  if (url.pathname === '/wxsend') {
    const params = await getParams(request);

    const content = params.content;
    const title = params.title;

    // token can come from body/url params or from Authorization header
    let requestToken = params.token;
    if (!requestToken) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader) {
        // support formats: 'Bearer <token>' or raw token
        const parts = authHeader.split(' ');
        requestToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : authHeader;
      }
    }

    if (!content || !title || !requestToken) {
      const responseBody = { msg: 'Missing required parameters: content, title, token' };
      return new Response(JSON.stringify(responseBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (requestToken !== env.API_TOKEN) {
      const responseBody = { msg: 'Invalid token' };
      return new Response(JSON.stringify(responseBody), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const appid = params.appid || env.WX_APPID;
    const secret = params.secret || env.WX_SECRET;
    const useridStr = params.userid || env.WX_USERID;
    const template_id = params.template_id || env.WX_TEMPLATE_ID;
    const skin = getSkinByKey(params.skin || env.WX_SKIN);
    const finalBaseUrl = buildSkinLink(params.base_url || env.WX_BASE_URL, skin, url);

    if (!appid || !secret || !useridStr || !template_id) {
      const responseBody = { msg: 'Missing required environment variables: WX_APPID, WX_SECRET, WX_USERID, WX_TEMPLATE_ID' };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);

    try {
      const accessToken = await getStableToken(appid, secret);
      if (!accessToken) {
        const responseBody = { msg: 'Failed to get access token' };
        return new Response(JSON.stringify(responseBody), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const results = await Promise.all(user_list.map(userid =>
        sendMessage(accessToken, userid, template_id, finalBaseUrl, title, content)
      ));

      const successfulMessages = results.filter(r => r.errmsg === 'ok');

      if (successfulMessages.length > 0) {
        const responseBody = {
          msg: `Successfully sent messages to ${successfulMessages.length} user(s). First response: ok`,
          skin: skin.slug,
          jump_url: finalBaseUrl,
        };
        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const firstError = results.length > 0 ? results[0].errmsg : 'Unknown error';
      const responseBody = { msg: `Failed to send messages. First error: ${firstError}` };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch (error) {
      console.error('Error:', error);
      const responseBody = { msg: `An error occurred: ${error.message}` };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
  }

  // If not /wxsend, handle homepage or other paths
  // If request is a GET to root, serve a simple HTML homepage describing the service
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush — 微信消息推送服务</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
      }
      .card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 90%;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
      }
      .author {
        margin: 20px 0;
        color: #374151;
        font-size: 14px;
      }
      .icons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 24px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 12px;
        text-decoration: none;
        color: #374151;
        background: #f4f4f5;
        border: 1px solid #e4e4e7;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      .btn:hover {
        background: #ffffff;
        border-color: #d4d4d8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .icon {
        width: 22px;
        height: 22px;
        display: inline-block;
      }
      footer {
        margin-top: 24px;
        color: #6b7280;
        font-size: 12px;
      }
      .skins {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .skin {
        display: block;
        border: 1px solid #e4e4e7;
        border-radius: 10px;
        padding: 10px;
        text-decoration: none;
        color: #374151;
        font-size: 13px;
        background: #fafafa;
      }
      .skin:hover {
        border-color: #a78bfa;
        background: #fff;
      }
      @media (max-width: 640px) {
        .skins {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>WXPush</h1>
      <p>一个极简、可靠的微信消息推送服务，通过简单的 Webhook 请求，即可向微信用户发送模板消息。</p>
      <div class="author">作者：<strong>饭奇骏</strong></div>

      <div class="skins">
        <a class="skin" href="/skins/classic/index.html">经典卡片皮肤</a>
        <a class="skin" href="/skins/night/index.html">静谧的夜空皮肤</a>
        <a class="skin" href="/skins/hacker/index.html">MacOS Hacker 皮肤</a>
      </div>

      <div class="icons">
        <a class="btn" href="https://github.com/frankiejun" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.2 9.11 7.64 10.59.56.1.76-.24.76-.53 0-.26-.01-.95-.02-1.87-3.11.68-3.77-1.5-3.77-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1.0 1.72 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.21 1.16-2.99-.12-.28-.5-1.41.11-2.94 0 0 .95-.31 3.12 1.15.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.17-1.46 3.12-1.15 3.12-1.15.61 1.53.23 2.66.11 2.94.72.78 1.16 1.77 1.16 2.99 0 4.3-2.62 5.25-5.11 5.53.4.35.75 1.04.75 2.09 0 1.51-.01 2.72-.01 3.09 0 .29.2.63.77.52C19.05 20.86 22.25 16.68 22.25 11.75 22.25 5.48 17.27.5 12 .5z"/></svg>
          GitHub
        </a>
        <a class="btn" href="https://www.youtube.com/@frankiejun8965" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2s-.23-1.63-.94-2.34C21.55 3 19.9 3 19.12 2.9 16.54 2.6 12 2.6 12 2.6s-4.53 0-7.12.3C4.1 3 2.45 3.1 1.44 3.86.73 4.47.5 6.1.5 6.1S.25 8 .25 9.9v2.2c0 1.93.25 3.8.25 3.8s.23 1.63.94 2.34c.99.76 2.64.76 3.42.86 2.6.3 7.12.3 7.12.3s4.53 0 7.12-.3c.79-.1 2.44-.1 3.43-.86.7-.7.94-2.34.94-2.34s.25-1.9.25-3.8V9.9c0-1.9-.25-3.7-.25-3.7zM9.75 15.3V8.7l6.18 3.3-6.18 3.3z"/></svg>
          YouTube
        </a>
      </div>
      <footer>点击上方图标前往关注，以获取更多项目更新和演示。</footer>
    </div>
  </body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // For any other path/method, return 404
  return new Response('Not Found', { status: 404 });
}

async function getStableToken(appid, secret) {
  const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/stable_token';
  const payload = {
    grant_type: 'client_credential',
    appid: appid,
    secret: secret,
    force_refresh: false,
  };
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.access_token;
}

async function sendMessage(accessToken, userid, template_id, base_url, title, content) {
  const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  // Create a Date object for Beijing time (UTC+8) by adding 8 hours to the current UTC time
  const beijingTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  // Format the date to 'YYYY-MM-DD HH:MM:SS' string
  const date = beijingTime.toISOString().slice(0, 19).replace('T', ' ');

  const jumpUrl = new URL(base_url);
  jumpUrl.searchParams.set('message', content);
  jumpUrl.searchParams.set('date', date);
  jumpUrl.searchParams.set('title', title);

  const payload = {
    touser: userid,
    template_id: template_id,
    url: jumpUrl.toString(),
    data: {
      title: { value: title },
      content: { value: content },
    },
  };

  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return await response.json();
}


