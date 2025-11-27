import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_TOP_K } from '@/config';
import { searchResultsToChunks, getSourcesFromChunks, getContextFromSources } from '@/lib/sources';
import { PINECONE_INDEX_NAME } from '@/config';
import { generateEmbedding } from './embeddings';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

export interface PineconeSearchResult {
    results: Array<{
        text: string;
        metadata: any;
        score: number;
    }>;
}

/**
 * Search Pinecone with namespace, filters, and OpenAI embeddings
 */
export async function searchPinecone(
    query: string,
    namespace: string,
    filters?: Record<string, any>,
    topK?: number
): Promise<PineconeSearchResult> {
    try {
        // Generate OpenAI embedding (1024 dimensions)
        const embedding = await generateEmbedding(query);

        // Build query options
        const queryOptions: any = {
            vector: embedding,
            topK: topK || PINECONE_TOP_K,
            includeMetadata: true,
        };

        // Add filter if provided
        if (filters && Object.keys(filters).length > 0) {
            queryOptions.filter = filters;
        }

        // Use query method with vector
        const queryResponse = await pineconeIndex.namespace(namespace).query(queryOptions);

        // Map Pinecone matches to result structure
        const results = (queryResponse.matches || []).map((match: any) => {
            const metadata = match.metadata || {};
            const values = match.values || [];
            
            // Extract text from metadata or values - try multiple possible fields
            const text = metadata.text || 
                         metadata.chunk_text || 
                         metadata.content ||
                         metadata.field_text ||
                         (Array.isArray(values) && values.length > 0 && typeof values[0] === 'string' ? values[0] : '') ||
                         '';

            return {
                text: text || JSON.stringify(metadata), // Fallback to metadata JSON if no text found
                metadata: metadata,
                score: match.score || 0,
            };
        });

        return { results };
    } catch (error) {
        console.error('Error searching Pinecone:', error);
        // Return empty results on error
        return { results: [] };
    }
}

/**
 * Legacy search function for backward compatibility
 * Uses default namespace and returns formatted string
 */
export async function searchPineconeLegacy(
    query: string,
): Promise<string> {
    const results = await pineconeIndex.namespace('default').searchRecords({
        query: {
            inputs: {
                text: query,
            },
            topK: PINECONE_TOP_K,
        },
        fields: ['text', 'pre_context', 'post_context', 'source_url', 'source_description', 'source_type', 'order'],
    });

    const chunks = searchResultsToChunks(results);
    const sources = getSourcesFromChunks(chunks);
    const context = getContextFromSources(sources);
    return `< results > ${context} </results>`;
}