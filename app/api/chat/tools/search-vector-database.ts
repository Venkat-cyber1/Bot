import { tool } from "ai";
import { z } from "zod";
import { searchPinecone } from "@/lib/pinecone";
import { searchResultsToChunks, getSourcesFromChunks, getContextFromSources } from "@/lib/sources";

export const vectorDatabaseSearch = tool({
    description: 'Search the vector database (Pinecone) for match performance analytics or historic knowledge. Use performance_analytics namespace for live match data, player performance, current match stats. Use historic_knowledge namespace for historical data, past matches, seasons, career stats.',
    inputSchema: z.object({
        query: z.string().describe('The query to search the vector database for. Optimally is a hypothetical answer for similarity search.'),
        namespace: z.enum(["performance_analytics", "historic_knowledge"]).describe('The namespace to search: performance_analytics for live/current match data, historic_knowledge for historical data.'),
        filters: z.record(z.any()).optional().describe('Optional metadata filters (e.g., { player: { $eq: "Arjun Rao" }, match_id: { $eq: "match_1" } })'),
    }),
    execute: async ({ query, namespace, filters }) => {
        const searchResult = await searchPinecone(query, namespace, filters);
        
        // Format results for compatibility with existing chunk processing
        // Convert to format that searchResultsToChunks can handle
        const formattedResults = {
            matches: searchResult.results.map((result) => ({
                id: result.metadata?.id || '',
                score: result.score,
                metadata: result.metadata,
                values: [],
                fields: {
                    text: result.text,
                    chunk_text: result.text,
                    pre_context: result.metadata?.pre_context || '',
                    post_context: result.metadata?.post_context || '',
                    source_url: result.metadata?.source_url || '',
                    source_description: result.metadata?.source_description || '',
                    source_name: result.metadata?.source_name || '',
                    order: result.metadata?.order || 0,
                }
            }))
        };

        const chunks = searchResultsToChunks(formattedResults);
        const sources = getSourcesFromChunks(chunks);
        const context = getContextFromSources(sources);
        
        return {
            namespace,
            query,
            results: searchResult.results,
            context: `< results > ${context} </results>`
        };
    },
});

