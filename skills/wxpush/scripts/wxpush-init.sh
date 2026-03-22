#!/bin/bash
# WXPush 初始化脚本 — 交互式引导创建 wxpush.env
# 用法: bash wxpush-init.sh

CONFIG_DIR="$HOME/.config/wxpush"
ENV_FILE="$CONFIG_DIR/wxpush.env"

mkdir -p "$CONFIG_DIR"

if [[ -f "$ENV_FILE" ]]; then
  echo "⚠️  配置文件已存在: $ENV_FILE"
  read -p "是否覆盖？(y/N): " confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && exit 0
fi

echo ""
echo "=== WXPush 初始化配置 ==="
echo ""

# --- 选择 mode ---
echo "选择 API 格式（对应不同 GitHub 项目的 API）:"
echo "  1) edgeone    — https://github.com/shisheng820/WXPush-edgeone"
echo "                 有 token 时只需 token，无 token 需完整 wx 配置"
echo "  2) wxpush     — https://github.com/frankiejun/wxpush"
echo "                 必须有 token，wx 配置在服务端"
echo "  3) go-wxpush  — https://github.com/hezhizheng/go-wxpush"
echo "                 无 token，需完整 wx 配置"
echo ""
echo "注意：三个项目都支持 Docker/源码等部署方式，区别在于 API 格式。"
read -p "选择 [1/2/3] (默认 1): " mode_choice
case "$mode_choice" in
  2) MODE="wxpush" ;;
  3) MODE="go-wxpush" ;;
  *) MODE="edgeone" ;;
esac
echo ""

# --- 欢迎 Star 对应 GitHub 项目 ---
case "$MODE" in
  edgeone)   echo "⭐ Star 一下: https://github.com/shisheng820/WXPush-edgeone" ;;
  wxpush)    echo "⭐ Star 一下: https://github.com/frankiejun/wxpush" ;;
  go-wxpush) echo "⭐ Star 一下: https://github.com/hezhizheng/go-wxpush" ;;
esac
echo ""

# --- 服务地址 ---
read -p "服务地址 (留空使用默认): " API_URL
if [[ -z "$API_URL" ]]; then
  case "$MODE" in
    edgeone)   API_URL="https://wxpush.hunluan.space" ;;
    wxpush)    echo "❌ wxpush 模式必须填写服务地址"; exit 1 ;;
    go-wxpush) API_URL="https://push.hzz.cool" ;;
  esac
  echo "  → 使用默认地址: $API_URL"
fi
echo ""

# --- Token + wx 配置 ---
APPID="" SECRET="" USERID="" TEMPLATE_ID=""

case "$MODE" in
  edgeone)
    read -p "API Token (可选，不填则需提供 wx 配置): " API_TOKEN
    echo ""
    if [[ -n "$API_TOKEN" ]]; then
      read -p "是否还要填写 wx 配置？(y/N): " need_wx
      if [[ "$need_wx" == "y" || "$need_wx" == "Y" ]]; then
        echo "wx 配置（可选，留空则使用服务端默认值）:"
        read -p "微信 AppID: " APPID
        read -p "微信 Secret: " SECRET
        read -p "接收用户 OpenID (多用户用 | 分隔): " USERID
        read -p "模板 ID: " TEMPLATE_ID
      fi
    else
      echo "未提供 token，需要填写完整 wx 配置。"
      echo ""
      echo "wx 配置（必填）:"
      read -p "微信 AppID: " APPID
      read -p "微信 Secret: " SECRET
      read -p "接收用户 OpenID (多用户用 | 分隔): " USERID
      read -p "模板 ID: " TEMPLATE_ID
    fi
    ;;
  wxpush)
    read -p "API Token (必填): " API_TOKEN
    echo ""
    read -p "是否还要填写 wx 配置（覆盖服务端默认值）？(y/N): " need_wx
    if [[ "$need_wx" == "y" || "$need_wx" == "Y" ]]; then
      read -p "微信 AppID: " APPID
      read -p "微信 Secret: " SECRET
      read -p "接收用户 OpenID (多用户用 | 分隔): " USERID
      read -p "模板 ID: " TEMPLATE_ID
    fi
    ;;
  go-wxpush)
    API_TOKEN=""
    echo "wx 配置（必填）:"
    read -p "微信 AppID: " APPID
    read -p "微信 Secret: " SECRET
    read -p "接收用户 OpenID (多用户用 | 分隔): " USERID
    read -p "模板 ID: " TEMPLATE_ID
    ;;
esac
echo ""

# --- 可选参数 ---
read -p "皮肤名称 (可选，留空跳过，仅 edgeone 原生支持): " SKIN
read -p "跳转 URL (可选，留空跳过): " BASE_URL

# --- 写入配置 ---
cat > "$ENV_FILE" << EOF
# WXPush 配置文件
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# API 格式: $MODE

WXPUSH_API_URL=$API_URL
WXPUSH_API_TOKEN=${API_TOKEN:-}
WXPUSH_MODE=$MODE
WXPUSH_APPID=${APPID:-}
WXPUSH_SECRET=${SECRET:-}
WXPUSH_USERID=${USERID:-}
WXPUSH_TEMPLATE_ID=${TEMPLATE_ID:-}
WXPUSH_SKIN=${SKIN:-}
WXPUSH_BASE_URL=${BASE_URL:-}
EOF

chmod 600 "$ENV_FILE"
echo ""
echo "✅ 配置已保存到 $ENV_FILE"
echo "   权限已设为 600（仅当前用户可读写）"
if [[ "$MODE" == "edgeone" && -n "$API_TOKEN" && -z "$APPID" ]]; then
  echo ""
  echo "   Token 模式：只需 token，wx 配置在服务端处理。"
fi
echo ""
echo "发送测试消息："
echo "  bash ~/.config/opencode/skills/wxpush/scripts/wxpush.sh --title \"测试\" --content \"来自 wxpush 的消息\""
