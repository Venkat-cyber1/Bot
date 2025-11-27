import { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";


export function MessageWall({ messages, status, durations, onDurationChange, loaderTextIndex, loadingPhrases }: { messages: UIMessage[]; status?: string; durations?: Record<string, number>; onDurationChange?: (key: string, duration: number) => void; loaderTextIndex?: number; loadingPhrases?: string[] }) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, status]);

    return (
        <div className="relative max-w-3xl w-full">
            <div className="relative flex flex-col gap-4">
                {messages.map((message, messageIndex) => {
                    const isLastMessage = messageIndex === messages.length - 1;
                    return (
                        <div key={message.id} className="w-full">
                            {message.role === "user" ? <UserMessage message={message} /> : <AssistantMessage message={message} status={status} isLastMessage={isLastMessage} durations={durations} onDurationChange={onDurationChange} />}
                        </div>
                    );
                })}

                {status === "submitted" && (
                    <div aria-live="polite" className="w-full flex justify-center mt-4 mb-4">
                        <div className="inline-flex items-center gap-3 px-3 py-2 rounded-full bg-blue-600 text-white text-sm shadow-md">
                            <Loader2 className="size-4 animate-spin text-white" />
                            <span>{loadingPhrases?.[loaderTextIndex ?? 0] || "Thinking..."}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}