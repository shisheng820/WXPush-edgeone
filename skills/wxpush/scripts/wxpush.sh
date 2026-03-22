#!/bin/bash
# WXPush 发送脚本
# 读取 ~/.config/wxpush/wxpush.env 配置，支持命令行参数覆盖
# 用法: wxpush.sh --title "标题" --content "内容" [--appid xxx] [--secret xxx] ...

ENV_FILE="$HOME/.config/wxpush/wxpush.env"

# --- 加载 env 配置 ---
if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
else
  echo "❌ 配置文件不存在: $ENV_FILE"
  echo "   请先运行 wxpush-init.sh 创建配置"
  exit 1
fi

# --- 解析命令行参数（覆盖 env）---
TITLE=""
CONTENT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)      TITLE="$2"; shift 2 ;;
    --content)    CONTENT="$2"; shift 2 ;;
    --token)      WXPUSH_API_TOKEN="$2"; shift 2 ;;
    --appid)      WXPUSH_APPID="$2"; shift 2 ;;
    --secret)     WXPUSH_SECRET="$2"; shift 2 ;;
    --userid)     WXPUSH_USERID="$2"; shift 2 ;;
    --template_id) WXPUSH_TEMPLATE_ID="$2"; shift 2 ;;
    --skin)       WXPUSH_SKIN="$2"; shift 2 ;;
    --base_url)   WXPUSH_BASE_URL="$2"; shift 2 ;;
    --mode)       WXPUSH_MODE="$2"; shift 2 ;;
    --url)        WXPUSH_API_URL="$2"; shift 2 ;;
    *)            echo "未知参数: $1"; exit 1 ;;
  esac
done

# --- 校验必填参数 ---
if [[ -z "$TITLE" || -z "$CONTENT" ]]; then
  echo "用法: wxpush.sh --title \"标题\" --content \"内容\""
  exit 1
fi

MODE="${WXPUSH_MODE:-edgeone}"
API_URL="${WXPUSH_API_URL%/}"

# --- 默认 API 地址 ---
if [[ -z "$API_URL" ]]; then
  case "$MODE" in
    edgeone)   API_URL="https://wxpush.hunluan.space" ;;
    wxpush)    echo "❌ wxpush 模式请设置 WXPUSH_API_URL（你的服务地址）"; exit 1 ;;
    go-wxpush) API_URL="https://push.hzz.cool" ;;
  esac
fi


# --- 根据 mode 构建请求 ---
case "$MODE" in
  edgeone)
    # edgeone: 有 token 用 token，没有 token 需要完整 wx 配置
    if [[ -n "$WXPUSH_API_TOKEN" ]]; then
      curl -s -X POST "${API_URL}/wxsend" \
        -H "Content-Type: application/json" \
        -d "$(jq -nc \
          --arg t "$TITLE" \
          --arg c "$CONTENT" \
          --arg tk "$WXPUSH_API_TOKEN" \
          --arg sk "${WXPUSH_SKIN:-}" \
          --arg bu "${WXPUSH_BASE_URL:-}" \
          '{title:$t, content:$c, token:$tk} + (if $sk != "" then {skin:$sk} else {} end) + (if $bu != "" then {base_url:$bu} else {} end)')"
    else
      curl -s -X POST "${API_URL}/wxsend" \
        -H "Content-Type: application/json" \
        -d "$(jq -nc \
          --arg t "$TITLE" \
          --arg c "$CONTENT" \
          --arg ai "$WXPUSH_APPID" \
          --arg sc "$WXPUSH_SECRET" \
          --arg ui "$WXPUSH_USERID" \
          --arg ti "$WXPUSH_TEMPLATE_ID" \
          --arg sk "${WXPUSH_SKIN:-}" \
          --arg bu "${WXPUSH_BASE_URL:-}" \
          '{title:$t, content:$c, appid:$ai, secret:$sc, userid:$ui, template_id:$ti} + (if $sk != "" then {skin:$sk} else {} end) + (if $bu != "" then {base_url:$bu} else {} end)')"
    fi
    ;;

  wxpush)
    # wxpush (frankiejun): token 必填，wx 配置在服务端有默认值
    if [[ -z "$WXPUSH_API_TOKEN" ]]; then
      echo "❌ wxpush 模式必须配置 WXPUSH_API_TOKEN"
      exit 1
    fi
    POST_DATA=$(jq -nc --arg t "$TITLE" --arg c "$CONTENT" '{title:$t, content:$c}')
    [[ -n "$WXPUSH_APPID" ]]       && POST_DATA=$(echo "$POST_DATA" | jq --arg v "$WXPUSH_APPID"       '. + {appid: $v}')
    [[ -n "$WXPUSH_SECRET" ]]      && POST_DATA=$(echo "$POST_DATA" | jq --arg v "$WXPUSH_SECRET"      '. + {secret: $v}')
    [[ -n "$WXPUSH_USERID" ]]      && POST_DATA=$(echo "$POST_DATA" | jq --arg v "$WXPUSH_USERID"      '. + {userid: $v}')
    [[ -n "$WXPUSH_TEMPLATE_ID" ]] && POST_DATA=$(echo "$POST_DATA" | jq --arg v "$WXPUSH_TEMPLATE_ID" '. + {template_id: $v}')
    [[ -n "$WXPUSH_BASE_URL" ]]    && POST_DATA=$(echo "$POST_DATA" | jq --arg v "$WXPUSH_BASE_URL"    '. + {base_url: $v}')

    curl -s -X POST "${API_URL}/wxsend" \
      -H "Authorization: ${WXPUSH_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$POST_DATA"
    ;;

  go-wxpush)
    # go-wxpush: 无 token，必须传完整 wx 配置
    if [[ -z "$WXPUSH_APPID" || -z "$WXPUSH_SECRET" || -z "$WXPUSH_USERID" || -z "$WXPUSH_TEMPLATE_ID" ]]; then
      echo "❌ go-wxpush 模式必须配置 WXPUSH_APPID, WXPUSH_SECRET, WXPUSH_USERID, WXPUSH_TEMPLATE_ID"
      exit 1
    fi
    curl -s -X POST "${API_URL}/wxsend" \
      -H "Content-Type: application/json" \
      -d "$(jq -nc \
        --arg t "$TITLE" \
        --arg c "$CONTENT" \
        --arg ai "$WXPUSH_APPID" \
        --arg sc "$WXPUSH_SECRET" \
        --arg ui "$WXPUSH_USERID" \
        --arg ti "$WXPUSH_TEMPLATE_ID" \
        --arg bu "${WXPUSH_BASE_URL:-}" \
        '{title:$t, content:$c, appid:$ai, secret:$sc, userid:$ui, template_id:$ti} + (if $bu != "" then {base_url:$bu} else {} end)')"
    ;;

  *)
    echo "❌ 不支持的模式: $MODE (支持: edgeone | wxpush | go-wxpush)"
    exit 1
    ;;
esac

echo ""
