#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { searchGamesApi, SearchGamesParamsSchema, SearchGamesResponseSchema } from './search.js';
import {
  getGamePricesApi,
  getHistoricalLowApi,
  GetGamePricesParamsSchema,
  GetHistoricalLowParamsSchema,
  GamePricesResponseSchema,
  HistoricalLowResponseSchema,
} from './prices.js';
import {
  getGameBundlesApi,
  GetGameBundlesParamsSchema,
  GameBundlesResponseSchema,
} from './bundles.js';

const server = new Server(
  { name: 'mcp-server-ggdeals', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_games',
        description:
          "Search for video games by title on Steam. Use this to find a game's Steam App ID.",
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The title of the game to search for' },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'get_game_prices',
        description: 'Get the current prices and deals for a specific game across various stores.',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: { type: 'string', description: 'The unique Steam App ID' },
            region: { type: 'string', description: "The region code for pricing (default: 'us')" },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'get_historical_low',
        description: 'Get the all-time lowest recorded price for a specific game.',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: { type: 'string', description: 'The unique Steam App ID' },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'get_game_bundles',
        description:
          'Fetch specific bundles and packages (like Premium Editions) associated with a base game ID.',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: { type: 'string', description: 'The unique base Steam App ID' },
          },
          required: ['gameId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'search_games': {
        const parsedArgs = SearchGamesParamsSchema.parse(args);
        const rawData = await searchGamesApi(parsedArgs.title, parsedArgs.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(SearchGamesResponseSchema.parse(rawData), null, 2),
            },
          ],
        };
      }
      case 'get_game_prices': {
        const parsedArgs = GetGamePricesParamsSchema.parse(args);
        const rawData = await getGamePricesApi(parsedArgs.gameId, parsedArgs.region);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(GamePricesResponseSchema.parse(rawData), null, 2),
            },
          ],
        };
      }
      case 'get_historical_low': {
        const parsedArgs = GetHistoricalLowParamsSchema.parse(args);
        const rawData = await getHistoricalLowApi(parsedArgs.gameId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(HistoricalLowResponseSchema.parse(rawData), null, 2),
            },
          ],
        };
      }
      case 'get_game_bundles': {
        const parsedArgs = GetGameBundlesParamsSchema.parse(args);
        const rawData = await getGameBundlesApi(parsedArgs.gameId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(GameBundlesResponseSchema.parse(rawData), null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        { type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` },
      ],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-server-ggdeals running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
