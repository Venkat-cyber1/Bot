
import { streamText, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { MODEL } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { isContentFlagged } from '@/lib/moderation';
import { classifyIntent, type ParsedRealMadridIntent, isCurrentInfoQuery } from '@/lib/intent';
import { searchPinecone } from '@/lib/pinecone';
import { executeWebSearch } from './tools/web-search';
import { webSearch } from './tools/web-search';
import { vectorDatabaseSearch } from './tools/search-vector-database';

export const maxDuration = 30;

async function buildExaContext(
  userMessage: string,
  intent: string,
  entities: Partial<ParsedRealMadridIntent>
): Promise<string> {
  try {
    let query = userMessage;
    let searchType: 'live' | 'previous' | 'fan_reaction' | undefined;

    if (intent === 'exa_live_match') {
      query = `${entities.opponent ? `vs ${entities.opponent}` : ''} ${entities.competition || ''}`;
      searchType = 'live';
    } else if (intent === 'exa_previous_match') {
      query = `${entities.opponent ? `vs ${entities.opponent}` : ''} ${entities.competition || ''}`;
      searchType = 'previous';
    } else if (intent === 'exa_fan_reaction') {
      query = entities.player || entities.topic || userMessage;
      searchType = 'fan_reaction';
    }

    const result = await executeWebSearch(query.trim(), searchType);

    if (!result.results || result.results.length === 0) {
      return '';
    }

    const contextItems = result.results
      .map((r, idx) => `[${idx + 1}] ${r.title}\n${r.snippet}\n(Source: ${r.url})`)
      .join('\n\n');

    return `<exa_results>\n${contextItems}\n</exa_results>`;
  } catch (error) {
    console.error('Error building EXA context:', error);
    return '';
  }
}

async function buildPineconeContext(
  userMessage: string,
  entities: Partial<ParsedRealMadridIntent>
): Promise<string> {
  try {
    const filters: Record<string, any> = {};

    // Add optional filters based on extracted entities
    if (entities.player) {
      filters.player_name = { $eq: entities.player };
    }
    if (entities.topic) {
      filters.topic = { $eq: entities.topic };
    }

    const result = await searchPinecone(
      userMessage,
      'historic_knowledge',
      Object.keys(filters).length > 0 ? filters : undefined
    );

    if (!result.results || result.results.length === 0) {
      return '';
    }

    const contextItems = result.results
      .map((r, idx) => `[${idx + 1}] ${r.text}\n(Relevance: ${(r.score * 100).toFixed(1)}%)`)
      .join('\n\n');

    return `<historic_knowledge>\n${contextItems}\n</historic_knowledge>`;
  } catch (error) {
    console.error('Error building Pinecone context:', error);
    return '';
  }
}

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const latestUserMessage = messages
        .filter(msg => msg.role === 'user')
        .pop();

    let userMessageText = '';

    if (latestUserMessage) {
        const textParts = latestUserMessage.parts
            .filter(part => part.type === 'text')
            .map(part => 'text' in part ? part.text : '')
            .join('');

        userMessageText = textParts;

        if (textParts) {
            const moderationResult = await isContentFlagged(textParts);

            if (moderationResult.flagged) {
                const stream = createUIMessageStream({
                    execute({ writer }) {
                        const textId = 'moderation-denial-text';

                        writer.write({
                            type: 'start',
                        });

                        writer.write({
                            type: 'text-start',
                            id: textId,
                        });

                        writer.write({
                            type: 'text-delta',
                            id: textId,
                            delta: moderationResult.denialMessage || "Your message violates our guidelines. I can't answer that.",
                        });

                        writer.write({
                            type: 'text-end',
                            id: textId,
                        });

                        writer.write({
                            type: 'finish',
                        });
                    },
                });

                return createUIMessageStreamResponse({ stream });
            }
        }
    }

    // Classify intent and extract entities
    const parsedIntent = await classifyIntent(userMessageText);
    let retrievedContext = '';

    // Perform retrieval based on intent BEFORE calling streamText
    try {
        switch (parsedIntent.intent) {
            case 'exa_live_match': {
                retrievedContext = await buildExaContext(userMessageText, 'exa_live_match', parsedIntent);
                break;
            }

            case 'exa_previous_match': {
                retrievedContext = await buildExaContext(userMessageText, 'exa_previous_match', parsedIntent);
                break;
            }

            case 'exa_fan_reaction': {
                retrievedContext = await buildExaContext(userMessageText, 'exa_fan_reaction', parsedIntent);
                break;
            }

            case 'pinecone_historic': {
                retrievedContext = await buildPineconeContext(userMessageText, parsedIntent);
                break;
            }

            case 'general_football': {
                // No retrieval needed - use GPT knowledge only
                retrievedContext = '';
                break;
            }

            case 'generic':
            default: {
                // For generic intent, we need a smart fallback strategy
                // Check if it's asking for current/news info about Real Madrid
                const isCurrentInfo = isCurrentInfoQuery(userMessageText);
                
                if (isCurrentInfo) {
                  // Treat as live match query - fetch from EXA
                  retrievedContext = await buildExaContext(userMessageText, 'exa_live_match', {});
                } else {
                  // Treat as conceptual/historical - try Pinecone first
                  retrievedContext = await buildPineconeContext(userMessageText, {});
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error during intent-based retrieval:', error);
        // Continue without context rather than failing
    }

    // Build enhanced system prompt with retrieved context
    const enhancedSystemPrompt = retrievedContext
        ? `${SYSTEM_PROMPT}\n\n<retrieved_context>\n${retrievedContext}\n</retrieved_context>\n\nUse the retrieved context above to answer the user's question accurately. If the context doesn't contain the information needed, say so clearly rather than guessing.`
        : SYSTEM_PROMPT;

    const result = streamText({
        model: MODEL,
        system: enhancedSystemPrompt,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}