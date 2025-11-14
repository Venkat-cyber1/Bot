"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Eraser, Loader2, PlusIcon, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState } from "react";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

// Local storage utilities
const STORAGE_KEY = 'chat-messages';

const loadMessagesFromStorage = (): UIMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
};

const saveMessagesToStorage = (messages: UIMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
};

const clearMessagesFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear messages from localStorage:', error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    const storedMessages = loadMessagesFromStorage();
    setInitialMessages(storedMessages);
    setMessages(storedMessages);
  }, [setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    setMessages([]);
    clearMessagesFromStorage();
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex w-full flex-col dark:bg-black h-screen">
        <ChatHeader>
          <ChatHeaderBlock />
          <ChatHeaderBlock className="justify-center items-center">
            <Avatar>
              <AvatarImage src="/logo.png" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <p className="tracking-tight">Chat with AI</p>
          </ChatHeaderBlock>
          <ChatHeaderBlock className="justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={clearChat}
            >
              <Eraser className="size-4" />
              Clear
            </Button>
          </ChatHeaderBlock>
        </ChatHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4 w-full">
          <div className="flex flex-col items-center justify-end min-h-full">
            {isClient ? (
              <>
                <MessageWall messages={messages} status={status} />
                {status === "submitted" && (
                  <div className="flex justify-start max-w-3xl w-full">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center max-w-3xl w-full">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <div className="w-full px-5 py-5 items-center flex justify-center">
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
                          className="h-13 pr-12"
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
                            className="absolute right-2 top-2"
                            type="submit"
                            disabled={!field.value.trim()}
                            size="icon"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                        )}
                        {(status == "streaming" || status == "submitted") && (
                          <Button
                            className="absolute right-2 top-2"
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
      </main>
    </div >
  );
}
