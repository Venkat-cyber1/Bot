
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { MODEL, SYSTEM_PROMPT } from '@/config';
import { webSearch } from './tools/web-search';
import { readNotebookLecture } from './tools/read-notebook-lecture';
import { readSlideLecture } from './tools/read-slide-lecture';
import { readSyllabus } from './tools/read-syllabus';
import { readAssignment } from './tools/read-assignment';

export const maxDuration = 30;
export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: MODEL,
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
        tools: {
            webSearch,
            readNotebookLecture,
            readSlideLecture,
            readSyllabus,
            readAssignment,
        },
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}