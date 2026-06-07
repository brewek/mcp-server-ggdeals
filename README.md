# mcp-server-ggdeals

[![CI](https://github.com/your-org/mcp-server-ggdeals/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/mcp-server-ggdeals/actions/workflows/ci.yml)

A Model Context Protocol (MCP) server for integrating with [gg.deals](https://gg.deals/). Designed for Large Language Models to fetch game prices, historical lows, and bundles.

## Installation & Usage

Use `npx` to run the server instantly in your MCP Client (e.g., Claude Desktop). No cloning required.

**`claude_desktop_config.json`:**

```json
{
  "mcpServers": {
    "ggdeals": {
      "command": "npx",
      "args": ["-y", "mcp-server-ggdeals"],
      "env": {
        "GG_DEALS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

_Note: `GG_DEALS_API_KEY` is optional but recommended to avoid rate limits._
You can generate your API key by logging into your account: [https://gg.deals/settings/](https://gg.deals/settings/) -> **"Connections"** -> **GG.deals API key**.

## Available Tools

`

- `search_games`: Find a base game ID by title. (Note: This tool queries Steam Store API to retrieve Steam App ID, which is used for all gg.deals api calls).
- `get_game_prices`: Fetch current prices (Official & Keyshops).
- `get_historical_low`: Fetch the all-time lowest price.
- `get_game_bundles`: Fetch Premium/Deluxe DLC bundles linked to a base game.

## Architecture

Minimalist and modular codebase built with TypeScript and `Zod`:

- `src/index.ts`: MCP routing & initialization
- `src/api.ts`: Shared Axios client & error handling
- `src/search.ts`: Search logic
- `src/prices.ts`: Pricing & historical data
- `src/bundles.ts`: Bundles discovery

## Development

```bash
npm install
npm run build
npm run dev
```
