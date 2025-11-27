import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

/**
 * Execute Exa web search for Real Madrid-related queries
 */
export async function executeWebSearch(query: string, searchType?: 'live' | 'previous' | 'fan_reaction') {
  try {
    // Enhance query based on search type
    let enhancedQuery = query;
    
    if (searchType === 'live') {
      enhancedQuery = `Real Madrid live match ${query} score updates commentary`;
    } else if (searchType === 'previous') {
      enhancedQuery = `Real Madrid match report analysis ${query}`;
    } else if (searchType === 'fan_reaction') {
      enhancedQuery = `Real Madrid fans reaction reddit twitter X ${query}`;
    } else {
      enhancedQuery = `Real Madrid ${query}`;
    }

    const { results } = await exa.search(enhancedQuery, {
      contents: {
        text: true,
      },
      numResults: 5,
    });

    return {
      results: results.map(result => ({
        title: result.title || '',
        snippet: result.text?.slice(0, 500) || '',
        url: result.url || '',
        content: result.text?.slice(0, 1000) || '',
        publishedDate: result.publishedDate,
      }))
    };
  } catch (error) {
    console.error('Error searching the web with EXA:', error);
    return { results: [] };
  }
}

export const webSearch = tool({
  description: 'Search the web (via EXA) for Real Madrid live match updates, previous match analysis, or fan reactions. Use for current information not available in historic knowledge base.',
  inputSchema: z.object({
    query: z.string().min(1).describe('The search query, e.g., "vs Barcelona" or "Bellingham performance"'),
    searchType: z.enum(['live', 'previous', 'fan_reaction']).optional().describe('Type of search: "live" for current match, "previous" for match reports, "fan_reaction" for social media sentiment'),
  }),
  execute: async ({ query, searchType }) => {
    return await executeWebSearch(query, searchType);
  },
});