
import { streamText, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { MODEL, CURRENT_MATCH_ID } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { isContentFlagged } from '@/lib/moderation';
import { classifyIntent } from '@/lib/intent';
import { searchPinecone } from '@/lib/pinecone';
import { webSearch, executeWebSearch } from './tools/web-search';
import { vectorDatabaseSearch } from './tools/search-vector-database';

export const maxDuration = 30;
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

    // Perform searches based on intent BEFORE calling streamText
    try {
        switch (parsedIntent.intent) {
            case 'performance': {
                // Query performance_analytics namespace
                const filters: Record<string, any> = {
                    match_id: { $eq: CURRENT_MATCH_ID }
                };

                if (parsedIntent.player) {
                    filters.player = { $eq: parsedIntent.player };
                }

                if (parsedIntent.minute !== undefined && parsedIntent.minute !== null) {
                    // Add minute range filter (e.g., ±5 minutes around specified minute)
                    const minuteStart = Math.max(0, parsedIntent.minute - 5);
                    const minuteEnd = parsedIntent.minute + 5;
                    filters.minute = { $gte: minuteStart, $lte: minuteEnd };
                }

                const perfResults = await searchPinecone(
                    userMessageText,
                    'performance_analytics',
                    filters
                );

                // Format results for context
                const perfContext = perfResults.results
                    .map((r, idx) => {
                        const imageUrl = r.metadata?.image_url as string | undefined;
                        const imageAlt = r.metadata?.image_alt as string | undefined;
                        const imageLine = imageUrl
                            ? `\nImage URL: ${imageUrl}${imageAlt ? `\nImage Alt: ${imageAlt}` : ''}`
                            : '';
                        return `[${idx + 1}] ${r.text}${imageLine}\n(Score: ${r.score.toFixed(3)})`;
                    })
                    .join('\n\n');
                
                retrievedContext += `\n\n<performance_analytics_results>\n${perfContext}\n</performance_analytics_results>\n`;
                break;
            }

            case 'history': {
                // Query historic_knowledge namespace
                const filters: Record<string, any> = {};

                if (parsedIntent.player) {
                    filters.player = { $eq: parsedIntent.player };
                }

                if (parsedIntent.team) {
                    filters.team = { $eq: parsedIntent.team };
                }

                const histResults = await searchPinecone(
                    userMessageText,
                    'historic_knowledge',
                    Object.keys(filters).length > 0 ? filters : undefined
                );

                const histContext = histResults.results
                    .map((r, idx) => {
                        const imageUrl = r.metadata?.image_url as string | undefined;
                        const imageAlt = r.metadata?.image_alt as string | undefined;
                        const imageLine = imageUrl
                            ? `\nImage URL: ${imageUrl}${imageAlt ? `\nImage Alt: ${imageAlt}` : ''}`
                            : '';
                        return `[${idx + 1}] ${r.text}${imageLine}\n(Score: ${r.score.toFixed(3)})`;
                    })
                    .join('\n\n');
                
                retrievedContext += `\n\n<historic_knowledge_results>\n${histContext}\n</historic_knowledge_results>\n`;
                break;
            }

            case 'tactics': {
                // Tactical questions: rely on internal historic_knowledge only.
                const filters: Record<string, any> = {};

                if (parsedIntent.team) {
                    filters.team = { $eq: parsedIntent.team };
                }

                const tacticsResults = await searchPinecone(
                    userMessageText,
                    'historic_knowledge',
                    Object.keys(filters).length > 0 ? filters : undefined
                );

                const tacticsContext = tacticsResults.results
                    .map((r, idx) => {
                        const imageUrl = r.metadata?.image_url as string | undefined;
                        const imageAlt = r.metadata?.image_alt as string | undefined;
                        const imageLine = imageUrl
                            ? `\nImage URL: ${imageUrl}${imageAlt ? `\nImage Alt: ${imageAlt}` : ''}`
                            : '';
                        return `[${idx + 1}] ${r.text}${imageLine}\n(Score: ${r.score.toFixed(3)})`;
                    })
                    .join('\n\n');

                retrievedContext += `\n\n<tactics_internal_data>\n${tacticsContext}\n</tactics_internal_data>\n`;
                break;
            }

            case 'fan_conversation': {
                // Skip Pinecone, call Exa only
                let exaContext = '';
                try {
                    const exaResult = await executeWebSearch(userMessageText, 'fan_conversation');
                    exaContext = exaResult?.results?.map((r: any, idx: number) => 
                        `[${idx + 1}] ${r.title}: ${r.snippet} (${r.url})`
                    ).join('\n\n') || '';
                } catch (error) {
                    console.error('Error calling Exa for fan conversation:', error);
                    exaContext = '';
                }

                retrievedContext += `\n\n<fan_conversation_results>\n${exaContext}\n</fan_conversation_results>\n`;
                break;
            }

            case 'generic':
            default: {
                // General / non-match-specific questions:
                // Answer using internal Redchester knowledge only.
                const [perfResults, histResults] = await Promise.all([
                    searchPinecone(userMessageText, 'performance_analytics'),
                    searchPinecone(userMessageText, 'historic_knowledge')
                ]);

                const perfContext = perfResults.results
                    .map((r, idx) => {
                        const imageUrl = r.metadata?.image_url as string | undefined;
                        const imageAlt = r.metadata?.image_alt as string | undefined;
                        const imageLine = imageUrl
                            ? `\nImage URL: ${imageUrl}${imageAlt ? `\nImage Alt: ${imageAlt}` : ''}`
                            : '';
                        return `[${idx + 1}] ${r.text}${imageLine}\n(Score: ${r.score.toFixed(3)})`;
                    })
                    .join('\n\n');

                const histContext = histResults.results
                    .map((r, idx) => {
                        const imageUrl = r.metadata?.image_url as string | undefined;
                        const imageAlt = r.metadata?.image_alt as string | undefined;
                        const imageLine = imageUrl
                            ? `\nImage URL: ${imageUrl}${imageAlt ? `\nImage Alt: ${imageAlt}` : ''}`
                            : '';
                        return `[${idx + 1}] ${r.text}${imageLine}\n(Score: ${r.score.toFixed(3)})`;
                    })
                    .join('\n\n');

                retrievedContext += `\n\n<performance_analytics_results>\n${perfContext}\n</performance_analytics_results>\n`;
                retrievedContext += `\n\n<historic_knowledge_results>\n${histContext}\n</historic_knowledge_results>\n`;
                break;
            }
        }
    } catch (error) {
        console.error('Error during search orchestration:', error);
        // Continue without context rather than failing
    }

    // Build enhanced system prompt with retrieved context
    const enhancedSystemPrompt = retrievedContext 
        ? `${SYSTEM_PROMPT}\n\n<retrieved_context>\n${retrievedContext}\n</retrieved_context>\n\nUse the retrieved context above to answer the user's question. Never invent stats or facts - only use information from the retrieved context.`
        : SYSTEM_PROMPT;

    // NOTE:
    // Tools are temporarily disabled because of a runtime incompatibility between
    // the Vercel AI SDK tooling and the current Zod setup, which triggers
    // "Cannot read properties of undefined (reading '_zod')" inside the SDK.
    // Once the correct schema adapter is wired up, the `tools` config can be
    // re‑enabled.
    const result = streamText({
        model: MODEL,
        system: enhancedSystemPrompt,
        messages: convertToModelMessages(messages),
        // tools: {
        //     webSearch,
        //     vectorDatabaseSearch,
        // },
        stopWhen: stepCountIs(10),
        // These provider options are only supported for OpenAI "reasoning" models.
        // Since we're currently using a non‑reasoning model (gpt-4.1),
        // we omit reasoning-specific settings to avoid SDK warnings.
        // If you switch to a reasoning model (e.g. "o3-mini"),
        // you can reintroduce reasoning configuration here.
        providerOptions: {}
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}