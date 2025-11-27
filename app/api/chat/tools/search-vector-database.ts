import { tool } from "ai";
import { z } from "zod";
import { searchPinecone } from "@/lib/pinecone";

export const vectorDatabaseSearch = tool({
    description: 'Search the Pinecone vector database for Real Madrid historic knowledge. Use this for questions about Real Madrid tactics, players, club philosophy, and general club knowledge.',
    inputSchema: z.object({
        query: z.string().describe('Natural language query about Real Madrid tactics, players, club identity, or strategy. For example: "How does Real Madrid defend?" or "What is Bellingham\'s role?"'),
        namespace: z.string().default('historic_knowledge').describe('The Pinecone namespace to search. Use "historic_knowledge" for Real Madrid club knowledge.'),
        filters: z.record(z.string(), z.any()).optional().describe('Optional metadata filters for Pinecone. For example: { "player_name": { "$eq": "Bellingham" } }'),
    }),
    execute: async ({ query, namespace = 'historic_knowledge', filters }) => {
        const searchResult = await searchPinecone(query, namespace, filters);
        
        // Return structured results
        return {
            namespace,
            query,
            results: searchResult.results.map(r => ({
                text: r.text,
                score: r.score,
                metadata: r.metadata
            }))
        };
    },
});

