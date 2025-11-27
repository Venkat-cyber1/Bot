import OpenAI from 'openai';

export type RealMadridIntent =
  | "exa_live_match"
  | "exa_previous_match"
  | "exa_fan_reaction"
  | "pinecone_historic"
  | "general_football"
  | "generic";

export interface ParsedRealMadridIntent {
  intent: RealMadridIntent;
  opponent?: string;
  player?: string;
  team?: string;
  timeframe?: string;
  competition?: string;
  topic?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LIVE_MATCH_KEYWORDS = [
  'live', 'now', 'currently', 'right now', 'ongoing', 'this match',
  'live score', 'current score', 'minute', 'min', 'half-time', 'halftime',
  'full-time', 'ft', 'ht', 'lineups today', 'starting xi', 'who scored',
  'substitutions', 'latest', 'just now', 'this half', 'what\'s happening',
  'injuries', 'injured players', 'injury news', 'squad news', 'squad updates',
  'team news', 'availability', 'fit', 'fitness', 'out', 'sidelined'
];

const PREVIOUS_MATCH_KEYWORDS = [
  'last game', 'previous match', 'last match', 'last night',
  'when they last played', 'result vs', 'match report', 'match summary',
  'how did that game go', 'last fixture', 'previous fixture', 'yesterday',
  'past match', 'recent game'
];

const FAN_REACTION_KEYWORDS = [
  'fans saying', 'fan reaction', 'what are people saying',
  'reddit', 'twitter', 'x.com', 'social media', 'memes',
  'controversy online', 'online reaction', 'fan sentiment',
  'what do people think', 'opinions online', 'chatter', 'discourse'
];

const PINECONE_HISTORIC_KEYWORDS = [
  'how do real madrid play', 'real madrid tactics', 'real madrid formation',
  'real madrid style', 'player role', 'player profile', 'club philosophy',
  'club identity', 'club culture', 'academy', 'usual style', 'typical formation',
  'defensive pattern', 'offensive pattern', 'transitions', 'halfspace',
  'pressing', 'low block', 'high press', 'what kind of player', 'bernabéu',
  'valverde', 'bellingham', 'vinícius', 'rodrygo', 'real madrid history'
];

const GENERAL_FOOTBALL_KEYWORDS = [
  'what is a low block', 'what is a high press', 'what is a mid-block',
  'explain', 'definition', 'how does', 'general football',
  'football concept', 'what\'s a', 'inverted fullback', 'false 9',
  'gegenpressing', 'tiki-taka', 'counter-press'
];

function classifyIntentByKeywords(message: string): RealMadridIntent {
  const lower = message.toLowerCase();

  // Check for live match indicators
  if (LIVE_MATCH_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'exa_live_match';
  }

  // Check for previous match indicators
  if (PREVIOUS_MATCH_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'exa_previous_match';
  }

  // Check for fan reaction indicators
  if (FAN_REACTION_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'exa_fan_reaction';
  }

  // Check for Real Madrid-specific historic/tactical indicators
  if (PINECONE_HISTORIC_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'pinecone_historic';
  }

  // Check for general football concepts
  if (GENERAL_FOOTBALL_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'general_football';
  }

  return 'generic';
}

/**
 * Heuristic to detect if a query is asking for current/news information
 * vs abstract/conceptual information
 */
function isCurrentInfoQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Time indicators suggesting current info
  const timeIndicators = [
    'now', 'today', 'tonight', 'recent', 'latest', 'current',
    'yesterday', 'last night', 'update', 'news', 'report',
    'this week', 'this month', 'right now', 'just now',
    'recently', 'upcoming', 'next', 'scheduled'
  ];
  
  // Real Madrid + current info keywords
  const realMadridCurrentKeywords = [
    'real madrid', 'madrid', 'raul', 'our team', 'the team',
    'they', 'them', 'squad', 'roster', 'lineup', 'xi',
    'player', 'players', 'manager', 'coach', 'manager'
  ];
  
  // News/info seeking question patterns
  const infoSeekingPatterns = [
    /what.*(?:happening|going on|up with)/i,
    /how.*(?:doing|performing|playing)/i,
    /any news/i,
    /tell me about/i,
    /what.*status/i,
    /who.*(?:injured|out|playing|starting)/i,
    /is.*(?:available|fit|ready)/i,
    /where.*(?:play|feature)/i,
    /current.*(?:status|condition|form)/i,
    /latest.*(?:news|update|info)/i,
    /can.*(?:play|feature)/i,
    /has.*(?:recovered|returned)/i,
    /what about/i,
  ];
  
  // Check if it contains time indicators
  const hasTimeIndicator = timeIndicators.some(ti => lower.includes(ti));
  
  // Check if it's asking about Real Madrid current status
  const hasRealMadridContext = realMadridCurrentKeywords.some(kw => lower.includes(kw));
  
  // Check if it matches info-seeking patterns
  const matchesInfoPattern = infoSeekingPatterns.some(pattern => pattern.test(message));
  
  // It's a current info query if:
  // 1. Has time indicator + Real Madrid context, OR
  // 2. Matches info-seeking pattern + mentions Real Madrid/player/squad, OR
  // 3. Is asking "what about X" about Real Madrid
  return (hasTimeIndicator && hasRealMadridContext) || 
         (matchesInfoPattern && hasRealMadridContext) ||
         (matchesInfoPattern && !GENERAL_FOOTBALL_KEYWORDS.some(kw => lower.includes(kw)));
}

function extractEntities(message: string): Partial<ParsedRealMadridIntent> {
  const entities: Partial<ParsedRealMadridIntent> = {};
  const lower = message.toLowerCase();

  // Extract opponent (common Real Madrid opponents)
  const opponents = [
    'barcelona', 'atletico', 'sevilla', 'valencia', 'bilbao',
    'man city', 'manchester city', 'psg', 'paris', 'liverpool',
    'manchester united', 'chelsea', 'arsenal', 'milan', 'inter',
    'juventus', 'roma', 'napoli', 'borussia', 'dortmund',
    'benfica', 'ajax', 'tottenham', 'bayern', 'cologne'
  ];
  
  for (const opp of opponents) {
    if (lower.includes(opp)) {
      entities.opponent = opp;
      break;
    }
  }

  // Extract Real Madrid player names
  const players = [
    'bellingham', 'vinícius', 'rodrygo', 'valverde', 'kroos',
    'modric', 'nacho', 'alaba', 'courtois', 'benzema', 'ramos',
    'isco', 'ceballos', 'brahim', 'tchouameni', 'carvajal',
    'lunin', 'mendy', 'güler', 'osimhen', 'endrick'
  ];

  for (const player of players) {
    if (lower.includes(player)) {
      entities.player = player;
      break;
    }
  }

  // Extract timeframe
  if (lower.includes('today') || lower.includes('tonight')) {
    entities.timeframe = 'today';
  } else if (lower.includes('tomorrow')) {
    entities.timeframe = 'tomorrow';
  } else if (lower.includes('yesterday') || lower.includes('last night')) {
    entities.timeframe = 'yesterday';
  } else if (lower.match(/\d+\s*(minute|min|:|')/)) {
    const match = lower.match(/(\d+)\s*(minute|min|'|:)/);
    if (match) {
      entities.timeframe = `minute ${match[1]}`;
    }
  }

  // Extract competition
  const competitions = ['champions league', 'la liga', 'copa del rey', 'super cup', 'club world cup'];
  for (const comp of competitions) {
    if (lower.includes(comp)) {
      entities.competition = comp;
      break;
    }
  }

  return entities;
}

export async function classifyIntent(message: string): Promise<ParsedRealMadridIntent> {
  if (!message || message.trim().length === 0) {
    return { intent: 'generic' };
  }

  try {
    // Use keyword-based classification first for speed
    const keywordIntent = classifyIntentByKeywords(message);
    const entities = extractEntities(message);

    // For more complex cases, optionally use GPT-4o-mini for disambiguation
    // For now, keyword-based is sufficient and faster
    
    return {
      intent: keywordIntent,
      ...entities,
    };
  } catch (error) {
    console.error('Error classifying intent:', error);
    return { intent: 'generic' };
  }
}

export { isCurrentInfoQuery };



