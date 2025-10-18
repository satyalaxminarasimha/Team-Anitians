
"use client";
/**
 * @fileOverview This file contains the ChatPage component, which provides a
 * conversational interface for users to interact with the AI assistant, "PrepBot".
 *
 * It handles:
 * - User authentication and redirection.
 * - Loading and displaying chat history.
 * - Submitting user messages to the AI.
 * - Displaying AI responses.
 * - Saving the conversation history.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizonal, User, BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { chatWithAIAction, getChatHistoryAction, saveChatHistoryAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema for the chat input form.
const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * @interface Message
 * @description Represents a single message in the chat conversation.
 * @property {'user' | 'model'} role - Who sent the message.
 * @property {string} content - The text content of the message.
 */
export interface Message {
  role: "user" | "model";
  content: string;
}

/**
 * @component ChatPage
 * @description The main component for the chat interface. It orchestrates
 * fetching history, sending messages, and displaying the conversation.
 */
export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  // Effect to redirect unauthenticated users to the login page.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Effect to load the user's chat history when they log in.
  useEffect(() => {
    if (user) {
      setHistoryLoading(true);
      getChatHistoryAction(user.email).then(result => {
        if (result.success && result.data) {
          setMessages(result.data as Message[]);
        } else {
          toast({
            variant: "destructive",
            title: "History Error",
            description: result.error || "Could not load your chat history.",
          });
        }
        setHistoryLoading(false);
      });
    }
  }, [user, toast]);


  // Effect to automatically scroll to the bottom of the chat when new messages are added.
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
  }, [messages]);

  /**
   * Handles the submission of the chat form.
   * @param {FormValues} data - The form data containing the user's message.
   */
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const userMessage: Message = { role: "user", content: data.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); // Optimistically update UI with user's message.
    form.reset();

    startTransition(async () => {
      // Call the server action to get the AI's response.
      const result = await chatWithAIAction({ messages: newMessages });

      if (result.success && result.data) {
        const aiMessage: Message = { role: "model", content: result.data.response };
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        
        // Save the updated conversation history to the database.
        if (user) {
            await saveChatHistoryAction(user.email, finalMessages);
        }

      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Something went wrong. Please try again.",
        });
        // On error, remove the optimistically added user message.
        setMessages((prev) => prev.slice(0, -1));
      }
    });
  };

  const isLoading = authLoading || historyLoading;

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="container mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
            {messages.length === 0 && !isLoading ? (
              <WelcomeScreen />
            ) : (
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} user={user} />
                ))}
                {isPending && <ThinkingMessage />}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="bg-background border-t">
        <div className="container mx-auto max-w-3xl py-4 px-4 sm:px-6 lg:px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Ask anything about your exam subjects..."
                        autoComplete="off"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={isPending}>
                <SendHorizonal className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

/**
 * @component ChatMessage
 * @description Renders a single chat message bubble, styled differently for the user and the AI model.
 * @param {{ message: Message; user: { name: string, email: string } | null }} props
 */
function ChatMessage({ message, user }: { message: Message; user: { name: string, email: string } | null }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-start gap-4", isUser && "justify-end")}>
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarFallback><BrainCircuit className="text-primary"/></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-md rounded-lg p-4",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div 
          className="prose prose-sm max-w-none text-inherit" 
          dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, "<br />") }}
        />
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

/**
 * @component ThinkingMessage
 * @description Displays a loading indicator while the AI is generating a response.
 */
function ThinkingMessage() {
    return (
        <div className="flex items-start gap-4">
             <Avatar className="h-8 w-8 border">
                <AvatarFallback><BrainCircuit className="text-primary"/></AvatarFallback>
            </Avatar>
            <div className="max-w-md rounded-lg p-4 bg-muted">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">PrepBot is thinking...</span>
                </div>
            </div>
        </div>
    )
}

/**
 * @component WelcomeScreen
 * @description Displays a welcome message and prompt when the chat history is empty.
 */
function WelcomeScreen() {
    return (
        <div className="flex flex-col items-center justify-center text-center pt-24">
            <div className="flex items-center gap-2 text-5xl font-headline font-bold">
                <Sparkles className="h-12 w-12 text-primary"/>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Chat with PrepBot
                </span>
            </div>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
                Your personal AI tutor. Ask me anything about your exam subjects, from complex theories to study strategies.
            </p>
        </div>
    )
}
