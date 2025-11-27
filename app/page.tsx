"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Eraser, Loader2, Plus, PlusIcon, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import Image from 'next/image';

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = 'chat-messages';

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): { messages: UIMessage[]; durations: Record<string, number> } => {
  if (typeof window === 'undefined') return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const stored = typeof window !== 'undefined' ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  // Loader phrases and rotating text shown while a response is being generated
  const loadingPhrases = [
    "Loading... doing some thinking 🤔",
    "Crunching match stats... 📊",
    "Fetching tactical insights... ⚽️",
    "Assembling a witty reply... 😄",
    "Almost there... polishing the answer ✨",
  ];
  const [loaderTextIndex, setLoaderTextIndex] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (status === "submitted" || status === "streaming") {
      interval = window.setInterval(() => {
        setLoaderTextIndex((i) => (i + 1) % loadingPhrases.length);
      }, 1400);
    } else {
      setLoaderTextIndex(0);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  useEffect(() => {
    if (isClient && initialMessages.length === 0 && !welcomeMessageShownRef.current) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen flex-col font-sans dark:bg-black">
      <main className="w-full dark:bg-black flex flex-col h-screen relative">
        {/* PART 1: Header with logo */}
        <div className="flex-shrink-0 z-50 bg-linear-to-b from-background via-background/50 to-transparent dark:bg-black overflow-visible">
          <div className="relative overflow-visible">
            <ChatHeader>
              <ChatHeaderBlock />
              <ChatHeaderBlock className="justify-center items-center gap-3">
                <Avatar
                  className="size-12 ring-1 ring-primary"
                >
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback>
                    <Image src="/logo.png" alt="Logo" width={48} height={48} />
                  </AvatarFallback>
                </Avatar>
                <p className="text-lg font-semibold tracking-tight">Chat with {AI_NAME}</p>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={clearChat}
                >
                  <Plus className="size-4" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>

        {/* PART 2: Background image + Conversation space */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Background image container */}
          <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none">
            <div className="relative w-full h-full">
              <Image
                src="/background-center-v3.png"
                alt="Background"
                fill
                priority
                style={{ objectFit: 'fill', objectPosition: 'center', opacity: 1 }}
                className="bg-center-image"
              />
            </div>
          </div>

          {/* Messages container on top of background */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4 w-full">
            <div className="flex flex-col items-center min-h-full">
              <div className="flex-1" />
              <div className="w-full flex flex-col items-center">
                {isClient ? (
                  <>
                    <MessageWall messages={messages} status={status} durations={durations} onDurationChange={handleDurationChange} />
                    {status === "submitted" && (
                      <div className="flex justify-start max-w-3xl w-full">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center max-w-2xl w-full">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PART 3: Input box and footer */}
        <div className="flex-shrink-0 z-50 bg-linear-to-t from-background via-background/50 to-transparent dark:bg-black overflow-visible">
          <div className="w-full px-5 pt-5 pb-1 items-center flex justify-center relative overflow-visible">
            {/* Loader pill placed just above the input box */}
            {(status === "submitted" || status === "streaming") && (
              <div aria-live="polite" className="w-full flex justify-center mb-3">
                <div className="inline-flex items-center gap-3 px-3 py-2 rounded-full bg-blue-600 text-white text-sm shadow-md">
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>{loadingPhrases[loaderTextIndex]}</span>
                </div>
              </div>
            )}
            <div className="message-fade-overlay" />
            <div className="max-w-3xl w-full">
              <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="chat-form-message" className="sr-only">
                          Message
                        </FieldLabel>
                        <div className="relative h-13">
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-15 pr-15 pl-5 bg-card rounded-[20px]"
                            placeholder="Type your message here..."
                            disabled={status === "streaming"}
                            aria-invalid={fieldState.invalid}
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />
                          {(status == "ready" || status == "error") && (
                            <Button
                              className="absolute right-3 top-3 rounded-full"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}
                          {(status == "streaming" || status == "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full"
                              size="icon"
                              onClick={() => {
                                stop();
                              }}
                            >
                              <Square className="size-4" />
                            </Button>
                          )}
                        </div>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </div>
          <div className="w-full px-5 py-3 items-center flex justify-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {OWNER_NAME}&nbsp;<Link href="/terms" className="underline">Terms of Use</Link>&nbsp;Powered by&nbsp;<Link href="https://ringel.ai/" className="underline">Ringel.AI</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
