import { z } from 'zod';
import { fetchFromApi, parsePrice } from './api.js';

export const GetGameBundlesParamsSchema = z.object({
  gameId: z
    .string()
    .min(1, 'Game ID is required')
    .describe('The unique base game ID from gg.deals'),
});

export const GameBundlesResponseSchema = z.object({
  gameId: z.string(),
  bundles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().optional(),
      url: z.string().url(),
    }),
  ),
});

export async function getGameBundlesApi(gameId: string) {
  const data = await fetchFromApi<any>('/v1/bundles/by-steam-app-id/', { ids: gameId });
  if (!data?.success || !data?.data?.[gameId]) return { gameId, bundles: [] };

  const bundlesRaw = data.data[gameId].bundles || [];
  const bundles = bundlesRaw.map((b: any) => ({
    id: String(b.id || ''),
    name: b.name || 'Unknown Bundle',
    price: parsePrice(b.price),
    url: b.url || 'https://gg.deals',
  }));

  return { gameId, bundles };
}
