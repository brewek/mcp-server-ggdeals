import { z } from 'zod';
import axios from 'axios';

export const SearchGamesParamsSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .describe('The title of the game to search for'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(10)
    .describe('Maximum number of results to return'),
});

const GameSchema = z.object({
  id: z.string(),
  title: z.string(),
  releaseDate: z.string().optional(),
  coverImage: z.string().url().optional(),
});
export const SearchGamesResponseSchema = z.object({ games: z.array(GameSchema) });

export async function searchGamesApi(title: string, limit: number = 10) {
  const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
    params: { term: title, l: 'english', cc: 'US' },
    timeout: 10000,
  });
  const items = response.data?.items || [];
  const games = items.slice(0, limit).map((item: any) => ({
    id: String(item.id),
    title: item.name,
    coverImage: item.tiny_image || undefined,
  }));
  return { games };
}
