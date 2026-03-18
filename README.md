# EdgeOne WXPush Skin Integration

## Built-in skin routes

- `/skin/classic` : 经典卡片
- `/skin/night` : 静谧的夜空
- `/skin/hacker` : MacOS Hacker

## API usage

`/wxsend` now supports a new optional parameter: `skin`

- `skin=classic`
- `skin=night`
- `skin=hacker`

If `base_url` is not provided, the service now auto-selects a built-in skin link:

- `https://<your-domain>/skin/<skin>`

If `base_url` is provided, it has higher priority and will be used directly.

## Optional environment variable

You can set a default skin in EdgeOne env vars:

- `WX_SKIN=classic` (or `night` / `hacker`)

Priority order for skin selection:

1. Request param `skin`
2. Env var `WX_SKIN`
3. Fallback `classic`

## Test page

`/<API_TOKEN>` page now includes a built-in skin selector.

- If `base_url` is empty, selecting a skin will determine the jump URL automatically.
- If `base_url` is filled, the manual URL overrides skin route generation.
