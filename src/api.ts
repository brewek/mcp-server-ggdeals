import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

export const API_BASE_URL = 'https://api.gg.deals';
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'mcp-server-ggdeals/1.0.0',
  },
});

const API_KEY = process.env.GG_DEALS_API_KEY;
if (API_KEY) apiClient.defaults.params = { key: API_KEY };

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  },
  onRetry: (retryCount, error) => {
    console.error(`[gg.deals API] Retry attempt #${retryCount} after error: ${error.message}`);
  },
});

export async function fetchFromApi<T>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T> {
  try {
    const response = await apiClient.get<T>(endpoint, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error(
            `Authentication Error: ${API_KEY ? 'Invalid API key.' : 'API key required.'}`,
          );
        }
        if (error.response.status === 429) throw new Error('Rate Limit Exceeded.');
        if (error.response.status === 404) throw new Error('Not Found.');
        throw new Error(
          `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`,
        );
      }
      if (error.request) throw new Error('Network Error.');
      throw new Error(`Request Error: ${error.message}`);
    }
    throw new Error('Unexpected API error.');
  }
}

export const parsePrice = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};
