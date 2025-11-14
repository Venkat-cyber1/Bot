import { Pinecone } from '@pinecone-database/pinecone';
import { FilterType } from '@/types/data';
import OpenAI from 'openai';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
}

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index('carla-ai-busi-488');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

export async function readDocument(
    filterType: FilterType,
    hypothetical_document: string
) {
    const vector = await generateEmbedding(hypothetical_document);

    const results = await pineconeIndex.query({
        vector,
        topK: 10,
        includeMetadata: true,
        filter: {
            source_type: { $eq: filterType },
        },
    });

    return results;
}