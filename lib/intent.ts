import OpenAI from 'openai';

export type MatchIntent =
  | "performance"
  | "history"
  | "tactics"
  | "fan_conversation"
  | "generic";

export interface ParsedIntent {
  intent: MatchIntent;
  player?: string;
  team?: string;
  minute?: number | null;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function classifyIntent(message: string): Promise<ParsedIntent> {
  if (!message || message.trim().length === 0) {
    return { intent: "generic" };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an intent classifier for a football/soccer match companion AI. 
Analyze the user's message and classify it into one of these intents:

- **performance**: Questions about current match, live events, specific minute windows, shots, "this half", "right now", current player performance
- **history**: Questions about seasons, previous matches, career stats, past years, historical data
- **tactics**: Questions about formations, pressing, low block, high press, tactical strategies, team shape, transitions
- **fan_conversation**: Questions about fans, reactions, Twitter, Reddit, social media sentiment, "what people are saying"
- **generic**: Any other type of question

Also extract entities:
- **player**: Player names mentioned in the message
- **team**: Team names mentioned in the message
- **minute**: Minute numbers mentioned (extract as integer, or null if not mentioned)

Return ONLY valid JSON in this exact format:
{
  "intent": "performance" | "history" | "tactics" | "fan_conversation" | "generic",
  "player": "player name or undefined",
  "team": "team name or undefined",
  "minute": number or null
}

Examples:
- "How did Arjun Rao perform between minute 25–30?" → {"intent": "performance", "player": "Arjun Rao", "minute": 25}
- "What do fans think about the referee?" → {"intent": "fan_conversation"}
- "Why is Blueport pressing higher?" → {"intent": "tactics", "team": "Blueport"}
- "Has Leo Mendes been consistent this season?" → {"intent": "history", "player": "Leo Mendes"}
- "What formation are Redchester using?" → {"intent": "tactics", "team": "Redchester"}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { intent: "generic" };
    }

    const parsed = JSON.parse(content);
    
    // Validate intent
    const validIntents: MatchIntent[] = ["performance", "history", "tactics", "fan_conversation", "generic"];
    const intent: MatchIntent = validIntents.includes(parsed.intent) ? parsed.intent : "generic";

    return {
      intent,
      player: parsed.player || undefined,
      team: parsed.team || undefined,
      minute: parsed.minute !== undefined && parsed.minute !== null ? Number(parsed.minute) : undefined,
    };
  } catch (error) {
    console.error('Error classifying intent:', error);
    return { intent: "generic" };
  }
}


