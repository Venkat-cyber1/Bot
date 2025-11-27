import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

/**
 * Enhance query based on search type
 */
function enhanceQuery(query: string, queryType?: 'tactics' | 'fan_conversation'): string {
  if (queryType === 'tactics') {
    // Add tactical explanation terms
    return `${query} football explanation tactics explained soccer tactics`;
  } else if (queryType === 'fan_conversation') {
    // Add fan reaction terms
    return `${query} reddit twitter reactions fan opinions live reactions`;
  }
  return query;
}

/**
 * Execute Exa web search - can be called directly or via tool
 */
export async function executeWebSearch(query: string, queryType?: 'tactics' | 'fan_conversation') {
  try {
    const enhancedQuery = enhanceQuery(query, queryType);
    
    const { results } = await exa.search(enhancedQuery, {
      contents: {
        text: true,
      },
      numResults: 5,
    });

    return {
      results: results.map(result => ({
        title: result.title || '',
        snippet: result.text?.slice(0, 500) || result.text?.slice(0, 500) || '',
        url: result.url || '',
        content: result.text?.slice(0, 1000) || '',
        publishedDate: result.publishedDate,
      }))
    };
  } catch (error) {
    console.error('Error searching the web:', error);
    return { results: [] };
  }
}

export const webSearch = tool({
  description: 'Search the web for fan conversations, tactical explainers, or general information. Use for fan reactions, social media sentiment, or when needing deeper tactical explanations beyond internal data.',
  inputSchema: z.object({
    query: z.string().min(1).describe('The search query'),
    queryType: z.enum(['tactics', 'fan_conversation']).optional().describe('Optional: "tactics" for tactical explanations, "fan_conversation" for fan reactions and social media sentiment'),
  }),
  execute: async ({ query, queryType }) => {
    return await executeWebSearch(query, queryType);
  },
});