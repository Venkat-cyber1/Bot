import { tool } from "ai";
import { z } from "zod";
import { readDocument } from "@/lib/pinecone";

export const readSyllabus = tool({
    description: 'Read a syllabus and return the content of the syllabus',
    inputSchema: z.object({
        hypothetical_document: z.string(),
    }),
    execute: async ({ hypothetical_document }) => {
        return await readDocument('syllabus', hypothetical_document);
    },
});

