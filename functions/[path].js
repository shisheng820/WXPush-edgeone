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
  'warm-magazine': {
    name: '暖调杂志',
    slug: 'warm-magazine',
    route: '/skins/warm-magazine/index.html',
  },
  cyberpunk: {
    name: '赛博朋克',
    slug: 'cyberpunk',
    route: '/skins/cyberpunk/index.html',
  },
  sakura: {
    name: '樱花',
    slug: 'sakura',
    route: '/skins/sakura/index.html',
  },
  'terminal-neon': {
    name: '终端霓虹',
    slug: 'terminal-neon',
    route: '/skins/terminal-neon/index.html',
  },
  'ocean-breeze': {
    name: '海洋微风',
    slug: 'ocean-breeze',
    route: '/skins/ocean-breeze/index.html',
  },
  'hacker-dark': {
    name: '黑客暗黑',
    slug: 'hacker-dark',
    route: '/skins/hacker-dark/index.html',
  },
  'aurora-glass': {
    name: '极光玻璃',
    slug: 'aurora-glass',
    route: '/skins/aurora-glass/index.html',
  },
  'minimalist-light': {
    name: '极简浅色',
    slug: 'minimalist-light',
    route: '/skins/minimalist-light/index.html',
  },
  'quiet-night': {
    name: '静谧的夜空',
    slug: 'quiet-night',
    route: '/skins/quiet-night/index.html',
  },
  'sunset-glow': {
    name: '落日余晖',
    slug: 'sunset-glow',
    route: '/skins/sunset-glow/index.html',
  },
  'macos-hacker': {
    name: 'macOS 极客',
    slug: 'macos-hacker',
    route: '/skins/MacOS_Hacker_Theme-LGT/index.html',
  },
};

const DEFAULT_SKIN_KEY = 'warm-magazine';

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



export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);


  // If path is a single segment like '/<token>', serve an interactive test page
  // but ignore reserved paths like '/wxsend' and '/index.html'
  const singleSeg = url.pathname.match(/^\/([^\/]+)\/?$/);
  if (
    singleSeg &&
    singleSeg[1] &&
    singleSeg[1] !== 'wxsend' &&
    singleSeg[1] !== 'index.html'
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
        background: #fdf6f0;
        color: #4a3f35;
        box-sizing: border-box;
      }
      .container {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(139, 92, 71, 0.1);
        border: 1px solid #eee1d5;
        padding: 40px;
        max-width: 720px;
        width: 100%;
        text-align: left;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        color: #8b5c47;
      }
      .hint {
        color: #7c6d60;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
      }
      label {
        display: block;
        margin: 16px 0 8px;
        font-weight: 700;
        color: #5d4d42;
      }
      input[type=text], textarea, select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd1c5;
        border-radius: 8px;
        background: #fcfaf8;
        transition: all 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
        color: #4a3f35;
      }
      input[type=text]:focus, textarea:focus, select:focus {
        outline: none;
        border-color: #8b5c47;
        background: #ffffff;
        box-shadow: 0 0 0 2px rgba(139, 92, 71, 0.15);
      }
      button {
        margin-top: 24px;
        padding: 12px 24px;
        border-radius: 8px;
        border: 0;
        background: #8b5c47;
        color: #fff;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      button:hover {
        background: #734b39;
        transform: translateY(-1px);
      }
      button#clearBtn {
         background: #f8f1eb;
         color: #8b5c47;
         border: 1px solid #eee1d5;
      }
       button#clearBtn:hover {
         background: #fdf6f0;
         border-color: #8b5c47;
      }
      .skin-preview {
        margin-top: 8px;
        font-size: 13px;
        color: #8c7e73;
        margin-bottom: 24px;
      }
      /* Terminal UI Styles */
      .terminal-window {
        background: #1e1e1e;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        overflow: hidden;
        border: 1px solid #333;
        text-align: left;
      }
      .terminal-header {
        background: #323233;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #111;
      }
      .terminal-buttons {
        display: flex;
        gap: 8px;
      }
      .t-btn {
        width: 12px; height: 12px; border-radius: 50%;
      }
      .close-btn { background: #ff5f56; }
      .min-btn { background: #ffbd2e; }
      .max-btn { background: #27c93f; }
      .terminal-title {
        color: #999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        font-size: 13px;
        margin-left: 16px;
      }
      .terminal-body {
        padding: 16px;
        background: rgba(0, 0, 0, 0.9);
      }
      #responseArea {
        margin: 0;
        background: transparent;
        color: #00ff00;
        font-family: "Courier New", Courier, monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
        padding: 0;
        border-radius: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WXPush 测试页面</h1>
      <p class="hint">当前 token：<strong>${sanitizedToken}</strong></p>

      <form id="testForm">

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
          <option value="warm-magazine">暖调杂志</option>
          <option value="cyberpunk">赛博朋克</option>
          <option value="sakura">樱花</option>
          <option value="terminal-neon">终端霓虹</option>
          <option value="ocean-breeze">海洋微风</option>
          <option value="hacker-dark">黑客暗黑</option>
          <option value="aurora-glass">极光玻璃</option>
          <option value="minimalist-light">极简浅色</option>
          <option value="quiet-night">静谧的夜空</option>
          <option value="sunset-glow">落日余晖</option>
          <option value="macos-hacker">macOS 极客</option>
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
      <div id="responseCard" style="display:none; margin-top: 32px;">
        <div class="terminal-window">
          <div class="terminal-header">
            <div class="terminal-buttons">
              <span class="t-btn close-btn"></span>
              <span class="t-btn min-btn"></span>
              <span class="t-btn max-btn"></span>
            </div>
            <div class="terminal-title">bash - POST /wxsend</div>
          </div>
          <div class="terminal-body">
            <pre id="responseArea"></pre>
          </div>
        </div>
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

      const skinRouteMap = {
        'warm-magazine': '/skins/warm-magazine/index.html',
        cyberpunk: '/skins/cyberpunk/index.html',
        sakura: '/skins/sakura/index.html',
        'terminal-neon': '/skins/terminal-neon/index.html',
        'ocean-breeze': '/skins/ocean-breeze/index.html',
        'hacker-dark': '/skins/hacker-dark/index.html',
        'aurora-glass': '/skins/aurora-glass/index.html',
        'minimalist-light': '/skins/minimalist-light/index.html',
        'quiet-night': '/skins/quiet-night/index.html',
        'sunset-glow': '/skins/sunset-glow/index.html',
        'macos-hacker': '/skins/MacOS_Hacker_Theme-LGT/index.html'
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
        const selected = skinSelect.value || 'warm-magazine';
        const route = skinRouteMap[selected] || '/skins/warm-magazine/index.html';
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
          document.getElementById('skin').value = 'warm-magazine';
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
            const selected = (payload.skin || 'warm-magazine').toLowerCase();
            const route = skinRouteMap[selected] || '/skins/warm-magazine/index.html';
            payload.base_url = withAccessQuery(window.location.origin + route);
          }

          try {
            const headers = { 'Content-Type': 'application/json' };
            const token = document.getElementById('hiddenToken').value;
            if (token) headers['Authorization'] = token;

            const response = await fetch('/wxsend', { method: 'POST', headers, body: JSON.stringify(payload) });
            const responseText = await response.text();
            
            const lines = [];
            lines.push("$ curl -X POST /wxsend \\\\");
            lines.push('  -H "Content-Type: application/json" \\\\');
            if (token) lines.push('  -H "Authorization: ' + token + '" \\\\');
            lines.push("  -d '{...}'");
            lines.push("");
            lines.push("> HTTP/1.1 " + response.status + " " + (response.statusText || ""));
            
            try {
              const jsonObj = JSON.parse(responseText);
              lines.push("> Content-Type: application/json");
              lines.push("");
              lines.push(JSON.stringify(jsonObj, null, 2));
            } catch(e) {
              lines.push("");
              lines.push(responseText);
            }
            
            responseArea.textContent = lines.join('\\n');
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

    const missingParams = [];
    if (!content) missingParams.push('content');
    if (!title) missingParams.push('title');
    if (!requestToken) missingParams.push('token');

    if (missingParams.length > 0) {
      const responseBody = { msg: 'Missing required parameters: ' + missingParams.join(', ') };
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
        background: #fdf6f0;
        color: #4a3f35;
      }
      .card {
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 15px 45px rgba(139, 92, 71, 0.12);
        border: 1px solid #eee1d5;
        padding: 48px;
        max-width: 800px;
        width: 90%;
        text-align: center;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 36px;
        font-weight: 700;
        color: #8b5c47;
        letter-spacing: -0.02em;
      }
      p {
        color: #7c6d60;
        margin: 0 0 32px;
        font-size: 17px;
        line-height: 1.8;
      }
      .author {
        margin: 24px 0;
        color: #5d4d42;
        font-size: 15px;
      }
      .author strong {
        color: #8b5c47;
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
        padding: 14px 24px;
        border-radius: 12px;
        text-decoration: none;
        color: #fff;
        background: #8b5c47;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      .btn:hover {
        background: #734b39;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 92, 71, 0.2);
      }
      footer {
        margin-top: 32px;
        color: #a39589;
        font-size: 13px;
      }
      .skins {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        text-align: left;
      }
      .skin {
        display: flex;
        flex-direction: column;
        justify-content: center;
        border: 1px solid #eee1d5;
        border-radius: 12px;
        padding: 16px;
        text-decoration: none;
        color: #4a3f35;
        background: #fcfaf8;
        transition: all 0.2s ease;
      }
      .skin:hover {
        border-color: #8b5c47;
        background: #fff;
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(139, 92, 71, 0.08);
      }
      .skin-name {
        font-weight: 700;
        font-size: 15px;
        margin-bottom: 4px;
        color: #8b5c47;
      }
      .skin-desc {
        font-size: 13px;
        color: #8c7e73;
      }
      .preview-hint {
        margin-top: 16px;
        font-size: 14px;
        color: #8c7e73;
        font-style: italic;
      }
      .repo-link {
        margin-top: 24px;
      }
      .repo-link a {
        display: inline-block;
        padding: 12px 20px;
        border-radius: 10px;
        border: 1px solid #eee1d5;
        background: #fdf6f0;
        color: #8b5c47;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .repo-link a:hover {
        background: #fff;
        border-color: #8b5c47;
        transform: translateY(-1px);
      }
      @media (max-width: 640px) {
        .skins {
          grid-template-columns: 1fr;
        }
        .card {
          padding: 32px 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>WXPush</h1>
      <p>一个极简、可靠的微信消息推送服务。<br>通过简单的 Webhook 请求，即可向微信用户发送精美的模板消息。</p>
      <div class="author">作者：<strong>诗笙</strong></div>

      <div class="skins">
        <a class="skin" href="/skins/warm-magazine/index.html?title=%E6%9A%96%E8%B0%83%E6%9D%82%E5%BF%97&message=%E8%BF%99%E6%98%AF%E4%B8%80%E4%B8%AA%E6%B8%A9%E9%A6%A8%E7%9A%84%E6%8E%A8%E9%80%81%EF%BC%8C%E5%B8%A6%E7%BB%99%E4%BD%A0%E6%91%A9%E7%99%BB%E4%B8%8E%E6%9F%94%E5%92%8C%E7%9A%84%E8%A7%86%E8%A7%89%E4%BD%93%E9%AA%8C%E3%80%82&date=2026-03-19%2010%3A30%3A00">
          <span class="skin-name">暖调杂志 (默认)</span>
          <span class="skin-desc">优雅的杂志排版风格</span>
        </a>
        <a class="skin" href="/skins/cyberpunk/index.html?title=CYBERPUNK%20ALERT&message=Neural%20link%20established.%20Data%20stream%20synced%20to%20the%20grid.&date=2026-03-19%2022%3A15%3A00">
          <span class="skin-name">赛博朋克</span>
          <span class="skin-desc">霓虹色彩与未来感</span>
        </a>
        <a class="skin" href="/skins/sakura/index.html?title=%E6%A8%B1%E8%8A%B1%E9%80%9A%E7%9F%A5&message=%E6%A8%B1%E8%8A%B1%E9%A3%98%E8%90%BD%E7%9A%84%E5%AD%A3%E8%8A%82%EF%BC%8C%E8%BF%99%E6%98%AF%E4%B8%80%E4%BB%BD%E6%B8%85%E6%96%B0%E7%9A%84%E9%97%AE%E5%80%99%E3%80%82&date=2026-03-19%2014%3A20%3A00">
          <span class="skin-name">樱花</span>
          <span class="skin-desc">唯美清新的粉色调</span>
        </a>
        <a class="skin" href="/skins/terminal-neon/index.html?title=TERMINAL%20LOG&message=Process%20terminated%20with%20exit%20code%200.%20All%20systems%20nominal.&date=2026-03-19%2009%3A45%3A12">
          <span class="skin-name">终端霓虹</span>
          <span class="skin-desc">极客范的命令行美学</span>
        </a>
        <a class="skin" href="/skins/ocean-breeze/index.html?title=%E6%B5%B7%E6%B4%8B%E5%BE%AE%E9%A3%8E&message=%E5%90%AC%EF%BC%8C%E9%82%A3%E6%98%AF%E6%B5%B7%E6%B5%AA%E6%8B%8D%E6%89%93%E6%B2%99%E6%BB%A9%E7%9A%84%E5%A3%B0%E9%9F%B3%E3%80%82&date=2026-03-19%2011%3A00%3A00">
          <span class="skin-name">海洋微风</span>
          <span class="skin-desc">清爽宁静的蓝色调</span>
        </a>
        <a class="skin" href="/skins/hacker-dark/index.html?title=ROOT%20ACCESS&message=Unauthorized%20access%20detected%20at%20node%2072.%20Countermeasures%20active.&date=2026-03-19%2003%3A12%3A59">
          <span class="skin-name">黑客暗黑</span>
          <span class="skin-desc">深邃冷静的专业感</span>
        </a>
        <a class="skin" href="/skins/aurora-glass/index.html?title=%E6%9E%81%E5%85%89%E7%8E%BB%E7%92%83&message=%E4%BC%98%E9%9B%85%E7%9A%84%E6%AF%9B%E7%8E%BB%E7%92%83%E8%B4%A8%E6%84%9F%EF%BC%8C%E9%85%8D%E5%90%88%E6%A2%A6%E5%B9%BB%E7%9A%84%E6%9E%81%E5%85%89%E6%B8%90%E5%8F%98%E3%80%82&date=2026-03-19%2020%3A00%3A00">
          <span class="skin-name">极光玻璃</span>
          <span class="skin-desc">梦幻渐变与毛玻璃</span>
        </a>
        <a class="skin" href="/skins/minimalist-light/index.html?title=%E6%9E%81%E7%AE%80%E6%B5%85%E8%89%B2&message=%E5%B0%91%E5%8D%B3%E6%98%AF%E5%A4%9A%EF%BC%8C%E4%B8%BA%E4%BD%A0%E5%B8%A6%E6%9D%A5%E6%9C%80%E7%BA%AF%E7%B2%B9%E7%9A%84%E9%98%85%E8%AF%BB%E4%BD%93%E9%AA%8C%E3%80%82&date=2026-03-19%2008%3A30%3A00">
          <span class="skin-name">极简浅色</span>
          <span class="skin-desc">纯净至简的视觉享受</span>
        </a>
        <a class="skin" href="/skins/quiet-night/index.html?title=%E9%9D%99%E8%B0%20%E5%A4%9C%E7%A9%BA&message=%E5%9C%A8%E5%AE%81%E9%9D%99%E7%9A%84%E5%A4%9C%E8%89%B2%E4%B8%AD%EF%BC%8C%E4%BD%93%E9%AA%8C%E5%A6%82%E6%9C%88%E5%85%89%E8%88%AC%E6%9F%94%E5%92%8C%E7%9A%84%E9%80%9A%E7%9F%A5%E3%80%82&date=2026-03-19%2023%3A50%3A00">
          <span class="skin-name">静谧夜空</span>
          <span class="skin-desc">深邃柔和的暗色调</span>
        </a>
        <a class="skin" href="/skins/sunset-glow/index.html?title=%E8%90%BD%E6%97%A5%E4%BD%99%E6%99%96&message=%E9%87%91%E8%89%B2%E7%9A%84%E4%BD%99%E6%99%96%E6%B4%92%E6%BB%A1%E5%A4%A9%E9%99%85%EF%BC%8C%E6%B8%A9%E6%9A%96%E8%80%8C%E5%85%85%E6%BB%A1%E5%B8%8C%E6%9C%9B%E3%80%82&date=2026-03-19%2018%3A15%3A00">
          <span class="skin-name">落日余晖</span>
          <span class="skin-desc">温暖明亮的霞光色彩</span>
        </a>
        <a class="skin" href="/skins/MacOS_Hacker_Theme-LGT/index.html?title=Terminal%20-%20bash&message=Last%20login%3A%20Thu%20Mar%2019%2010%3A21%3A35%20on%20ttys001%0AWelcome%20to%20macOS%20Hacker%20Theme.&date=2026-03-19%2010%3A22%3A00">
          <span class="skin-name">macOS 极客</span>
          <span class="skin-desc">经典 macOS 终端风格</span>
        </a>
      </div>
      <div class="preview-hint">点击上方卡片预览不同风格的推送效果</div>
      <div class="repo-link">
        <a href="https://github.com/shisheng820/WXPush-edgeone" target="_blank" rel="noopener noreferrer">查看 GitHub 仓库</a>
      </div>
      <footer>专注稳定、简洁、好用的微信通知体验。</footer>
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
