import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate OpenAI embedding for text
 * Uses text-embedding-3-small with 1024 dimensions to match existing Pinecone index
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1024, // Match existing Pinecone index format
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== 1024) {
      throw new Error(`Invalid embedding length: expected 1024, got ${embedding?.length || 0}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}



