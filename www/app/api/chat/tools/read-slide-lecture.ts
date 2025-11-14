import { tool } from "ai";
import { z } from "zod";
import { readDocument } from "@/lib/pinecone";

export const readSlideLecture = tool({
    description: 'Read a slide lecture and return the content of the lecture',
    inputSchema: z.object({
        hypothetical_document: z.string(),
    }),
    execute: async ({ hypothetical_document }) => {
        return await readDocument('slide_lecture', hypothetical_document);
    },
});

