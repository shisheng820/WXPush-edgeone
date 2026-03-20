// Helper function to extract parameters from any request type
async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());

  let bodyParams = {};
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json();
        if (typeof jsonBody === 'string') {
          bodyParams = { content: jsonBody };
        } else if (jsonBody && typeof jsonBody === 'object') {
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
    }
  }

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

  // Allow handling wxsend or if it gets mapped directly to the function
  if (url.pathname !== '/wxsend' && !url.pathname.endsWith('wxsend.js')) {
    // Should not reach here if proper static routing is in place, but just in case
    return new Response('Not Found', { status: 404 });
  }

  const params = await getParams(request);

  const content = params.content;
  const title = params.title;

  let requestToken = params.token;
  if (!requestToken) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) {
      const parts = authHeader.split(' ');
      requestToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : authHeader;
    }
  }

  const missingParams = [];
  if (!content) missingParams.push('content');
  if (!title) missingParams.push('title');

  // Handle Token validation logic
  let appid, secret, useridStr, template_id;
  
  if (requestToken) {
    if (requestToken !== env.API_TOKEN) {
      return new Response(JSON.stringify({ msg: 'Token错误，无权使用内置配置 (Forbidden)' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    // Token is valid: Allow fallback to env variables
    appid = params.appid || env.WX_APPID;
    secret = params.secret || env.WX_SECRET;
    useridStr = params.userid || env.WX_USERID;
    template_id = params.template_id || env.WX_TEMPLATE_ID;
  } else {
    // No Token provided: Strictly require parameters from user, DO NOT fallback to env
    appid = params.appid;
    secret = params.secret;
    useridStr = params.userid;
    template_id = params.template_id;
    
    if (!appid) missingParams.push('appid');
    if (!secret) missingParams.push('secret');
    if (!useridStr) missingParams.push('userid');
    if (!template_id) missingParams.push('template_id');
  }

  if (missingParams.length > 0) {
    return new Response(JSON.stringify({ msg: 'Missing required parameters: ' + missingParams.join(', ') }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const skin = getSkinByKey(params.skin || env.WX_SKIN);
  const finalBaseUrl = buildSkinLink(params.base_url || env.WX_BASE_URL, skin, url);

  const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);

  try {
    const accessToken = await getStableToken(appid, secret);
    if (!accessToken) {
      return new Response(JSON.stringify({ msg: 'Failed to get access token. 请检查 APPID 和 SECRET 是否正确，以及 IP 白名单是否已配置（如为正式公众号）。' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const beijingTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const date = beijingTime.toISOString().slice(0, 19).replace('T', ' ');

    const jumpUrl = new URL(finalBaseUrl);
    jumpUrl.searchParams.set('message', content.replace(/\n/g, '~n~'));
    jumpUrl.searchParams.set('date', date);
    jumpUrl.searchParams.set('title', title);
    const jumpUrlStr = jumpUrl.toString();

    const results = await Promise.all(user_list.map(userid =>
      sendMessage(accessToken, userid, template_id, jumpUrlStr, title, content)
    ));

    const successfulMessages = results.filter(r => r.errmsg === 'ok');

    if (successfulMessages.length > 0) {
      return new Response(JSON.stringify({
        msg: `Successfully sent messages to ${successfulMessages.length} user(s). First response: ok`,
        skin: skin.slug,
        jump_url: jumpUrlStr,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const firstError = results.length > 0 ? results[0].errmsg : 'Unknown error';
    return new Response(JSON.stringify({ msg: `Failed to send messages. First error: ${firstError}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ msg: `An error occurred: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
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

async function sendMessage(accessToken, userid, template_id, target_url, title, content) {
  const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  const payload = {
    touser: userid,
    template_id: template_id,
    url: target_url,
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
