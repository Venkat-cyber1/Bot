import { tool } from "ai";
import { z } from "zod";
import { readDocument } from "@/lib/pinecone";

export const readAssignment = tool({
    description: 'Read an assignment and return the content of the assignment',
    inputSchema: z.object({
        hypothetical_document: z.string(),
    }),
    execute: async ({ hypothetical_document }) => {
        return await readDocument('assignment', hypothetical_document);
    },
});

