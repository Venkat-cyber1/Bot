import { UIMessage, ToolCallPart, ToolResultPart } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";
import { ToolCall, ToolResult } from "./tool-call";
import Image from "next/image";

export function AssistantMessage({ message, status, isLastMessage, durations, onDurationChange }: { message: UIMessage; status?: string; isLastMessage?: boolean; durations?: Record<string, number>; onDurationChange?: (key: string, duration: number) => void }) {
    return (
        <div className="w-full flex gap-3 items-start">
            {/* Logo */}
            <div className="flex-shrink-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-200">
                    <Image 
                        src="/logo.png" 
                        alt="Assistant" 
                        width={32} 
                        height={32}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1">
                <div className="text-sm flex flex-col gap-3">
                    {message.parts.map((part, i) => {
                        const isStreaming = status === "streaming" && isLastMessage && i === message.parts.length - 1;
                        const durationKey = `${message.id}-${i}`;
                        const duration = durations?.[durationKey];

                        const content = (() => {
                            if (part.type === "text") {
                                return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
                            } else if (part.type === "reasoning") {
                                return (
                                    <ReasoningPart
                                        key={`${message.id}-${i}`}
                                        part={part}
                                        isStreaming={isStreaming}
                                        duration={duration}
                                        onDurationChange={onDurationChange ? (d) => onDurationChange(durationKey, d) : undefined}
                                    />
                                );
                            } else if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                                if ('state' in part && part.state === "output-available") {
                                    return (
                                        <ToolResult
                                            key={`${message.id}-${i}`}
                                            part={part as unknown as ToolResultPart}
                                        />
                                    );
                                } else {
                                    return (
                                        <ToolCall
                                            key={`${message.id}-${i}`}
                                            part={part as unknown as ToolCallPart}
                                        />
                                    );
                                }
                            }
                            return null;
                        })();

                        if (!content) return null;

                        // Wrap every assistant part in a compact blue box with white text
                        return (
                            <div key={`${message.id}-box-${i}`} className="w-full flex justify-start">
                                <div className="max-w-lg w-fit px-3 py-2 rounded-[14px] bg-blue-600 text-white text-sm">
                                    {content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}