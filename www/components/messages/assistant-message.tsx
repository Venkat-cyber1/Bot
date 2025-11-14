import { UIMessage, ToolCallPart, ToolResultPart } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";
import { ToolCall, ToolResult } from "./tool-call";

export function AssistantMessage({ message, status, isLastMessage }: { message: UIMessage; status?: string; isLastMessage?: boolean }) {
    return (
        <div className="w-full">
            <div className="text-sm flex flex-col gap-4">
                {message.parts.map((part, i) => {
                    const isStreaming = status === "streaming" && isLastMessage && i === message.parts.length - 1;
                    switch (part.type) {
                        case "text":
                            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
                        case "reasoning":
                            return <ReasoningPart key={`${message.id}-${i}`} part={part} isStreaming={isStreaming} />;
                        case "tool-webSearch":
                        case "tool-readNotebookLecture":
                        case "tool-readSlideLecture":
                        case "tool-readSyllabus":
                        case "tool-readAssignment":
                            switch (part.state) {
                                case "output-available":
                                    return <ToolResult key={`${message.id}-${i}`} part={part as unknown as ToolResultPart} />;
                                default:
                                    return <ToolCall key={`${message.id}-${i}`} part={part as unknown as ToolCallPart} />;
                            }
                    }
                })}
            </div>
        </div>
    )
}