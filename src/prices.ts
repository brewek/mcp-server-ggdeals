import { z } from 'zod';
import { fetchFromApi, parsePrice } from './api.js';

export const GetGamePricesParamsSchema = z.object({
  gameId: z
    .string()
    .min(1, 'Game ID is required')
    .describe('The unique identifier for the game on gg.deals'),
  region: z
    .string()
    .optional()
    .default('us')
    .describe('The region code for pricing (e.g., us, eu, uk)'),
});
export const GetHistoricalLowParamsSchema = z.object({
  gameId: z
    .string()
    .min(1, 'Game ID is required')
    .describe('The unique identifier for the game on gg.deals'),
});

const DealSchema = z.object({
  store: z.string(),
  price: z.number(),
  url: z.string().url(),
  drm: z.string().optional(),
  isHistoricalLow: z.boolean().optional(),
});
export const GamePricesResponseSchema = z.object({
  gameId: z.string(),
  deals: z.array(DealSchema),
});

const HistoricalLowSchema = z.object({
  store: z.string(),
  price: z.number(),
  date: z.string(),
});
export const HistoricalLowResponseSchema = z.object({
  gameId: z.string(),
  historicalLow: HistoricalLowSchema,
});

export async function getGamePricesApi(gameId: string, region: string = 'us') {
  const data = await fetchFromApi<any>('/v1/prices/by-steam-app-id/', { ids: gameId, region });
  if (!data?.success || !data?.data?.[gameId]) return { gameId, deals: [] };

  const prices = data.data[gameId].prices;
  const url = data.data[gameId].url || 'https://gg.deals';
  const deals = [];

  const retailVal = parsePrice(prices.currentRetail);
  if (retailVal !== null) {
    deals.push({
      store: 'Official Retail',
      price: retailVal,
      url,
      isHistoricalLow: prices.currentRetail === prices.historicalRetail,
    });
  }

  const keyshopVal = parsePrice(prices.currentKeyshops);
  if (keyshopVal !== null) {
    deals.push({
      store: 'Keyshops',
      price: keyshopVal,
      url,
      isHistoricalLow: prices.currentKeyshops === prices.historicalKeyshops,
    });
  }
  return { gameId, deals };
}

export async function getHistoricalLowApi(gameId: string) {
  const data = await fetchFromApi<any>('/v1/prices/by-steam-app-id/', { ids: gameId });
  if (!data?.success || !data?.data?.[gameId]) throw new Error('Data not found');

  const prices = data.data[gameId].prices;
  const retailLow = parsePrice(prices.historicalRetail);
  const keyshopLow = parsePrice(prices.historicalKeyshops);

  let price = 0;
  let store = 'N/A';

  if (retailLow !== null && keyshopLow !== null) {
    if (retailLow <= keyshopLow) {
      price = retailLow;
      store = 'Official Retail';
    } else {
      price = keyshopLow;
      store = 'Keyshops';
    }
  } else if (retailLow !== null) {
    price = retailLow;
    store = 'Official Retail';
  } else if (keyshopLow !== null) {
    price = keyshopLow;
    store = 'Keyshops';
  } else throw new Error('No historical low');

  return { gameId, historicalLow: { store, price, date: new Date().toISOString().split('T')[0] } };
}
