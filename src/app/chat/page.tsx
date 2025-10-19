
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { 
  Loader2, SendHorizonal, BrainCircuit, Sparkles, 
  Plus, Menu, X, MessageSquare, ChevronRight, ChevronLeft,
  Edit2, Trash2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import * as actions from "./actions";


const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

import type { Message, ChatSession, SerializedChatSession } from '@/types/chat.types';

/**
 * @component ChatPage
 * @description The main component for the chat interface. It orchestrates
 * fetching history, sending messages, and displaying the conversation.
 */
export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
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

  // Load chat sessions
  useEffect(() => {
    if (user) {
      setHistoryLoading(true);
      actions.getChatSessions(user.email).then(result => {
        if (result.success && result.data) {
          setChatSessions(result.data);
        } else {
          toast({
            variant: "destructive",
            title: "History Error",
            description: "Could not load your chat history.",
          });
        }
        setHistoryLoading(false);
      });
    }
  }, [user, toast]);

  // Create new chat session
  const createNewChat = async () => {
    if (!user) return;
    
    const result = await actions.createNewChatSession(user.email);
    if (result.success && result.data) {
      setChatSessions(prev => [result.data, ...prev]);
      setCurrentSession(result.data);
    }
  };

  // Load chat session
  const loadChatSession = async (sessionId: string) => {
    const result = await actions.getChatSession(sessionId);
    if (result.success && result.data) {
      setCurrentSession(result.data);
    }
  };

  // Delete chat session
  const deleteSession = async (sessionId: string) => {
    await actions.deleteChatSession(sessionId);
    setChatSessions(prev => prev.filter(session => session._id !== sessionId));
    if (currentSession?._id === sessionId) {
      setCurrentSession(null);
    }
  };

  // Edit chat session title
  const startEditing = (sessionId: string, title: string) => {
    setIsEditing(sessionId);
    setEditedTitle(title);
  };

  const saveTitle = async (sessionId: string) => {
    const result = await actions.updateSessionTitle(sessionId, editedTitle);
    if (result.success) {
      setChatSessions(prev => 
        prev.map(session => 
          session._id === sessionId 
            ? { ...session, title: editedTitle }
            : session
        )
      );
      if (currentSession?._id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title: editedTitle } : null);
      }
    }
    setIsEditing(null);
  };


  // Effect to automatically scroll to the bottom of the chat when new messages are added.
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
  }, [currentSession?.messages]);

  /**
   * Handles the submission of the chat form.
   * @param {FormValues} data - The form data containing the user's message.
   */
  const onSubmit = async (data: FormValues) => {
    if (!currentSession) {
      const result = await actions.createNewChatSession(user!.email);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not create new chat session",
        });
        return;
      }
      setCurrentSession(result.data);
      setChatSessions(prev => [result.data, ...prev]);
    }

    const sessionId = currentSession?._id;
    if (!sessionId) return;

    const userMessage: Message = { role: "user", content: data.message };
    const newMessages = [...(currentSession?.messages || []), userMessage];
    
    // Optimistically update UI
    setCurrentSession(prev => prev ? { ...prev, messages: newMessages } : null);
    form.reset();

    startTransition(async () => {
      const result = await actions.sendChatMessage(sessionId, newMessages);

      if (result.success && result.data) {
        const { response, session } = result.data;
        
        if (session) {
          setCurrentSession(session);
          
          // Update session in the list
          setChatSessions(prev => 
            prev.map(s => s._id === sessionId ? session : s)
          );
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Something went wrong. Please try again.",
        });
        // Revert optimistic update
        setCurrentSession(prev => prev ? { ...prev, messages: currentSession.messages } : null);
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
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Mobile history sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden absolute left-4 top-4">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <ChatSidebar
            sessions={chatSessions}
            currentSessionId={currentSession?._id}
            onSelectSession={loadChatSession}
            onNewChat={createNewChat}
            onDeleteSession={deleteSession}
            isEditing={isEditing}
            editedTitle={editedTitle}
            setEditedTitle={setEditedTitle}
            onStartEditing={startEditing}
            onSaveTitle={saveTitle}
            loading={historyLoading}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop history sidebar */}
      <div className={cn(
        "hidden lg:block border-r bg-muted/30 transition-all duration-300",
        isHistoryOpen ? "w-80" : "w-16"
      )}>
        <div className={cn(
          "absolute top-1/2 -right-3 z-10",
          "bg-primary text-primary-foreground rounded-full p-0.5",
          "cursor-pointer hover:scale-110 transition-transform"
        )} onClick={() => setIsHistoryOpen(prev => !prev)}>
          {isHistoryOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        
        <ChatSidebar
          sessions={chatSessions}
          currentSessionId={currentSession?._id}
          onSelectSession={loadChatSession}
          onNewChat={createNewChat}
          onDeleteSession={deleteSession}
          isEditing={isEditing}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          onStartEditing={startEditing}
          onSaveTitle={saveTitle}
          loading={historyLoading}
          collapsed={!isHistoryOpen}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="container max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
            {!currentSession?.messages?.length ? (
              <WelcomeScreen />
            ) : (
              <div className="space-y-6">
                {currentSession.messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} user={user} />
                ))}
                {isPending && <ThinkingMessage />}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-background border-t">
          <div className="container max-w-3xl py-4 px-4 sm:px-6 lg:px-8">
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
    </div>
  );
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isEditing: string | null;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  onStartEditing: (id: string, title: string) => void;
  onSaveTitle: (id: string) => void;
  loading: boolean;
  collapsed?: boolean;
}

function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isEditing,
  editedTitle,
  setEditedTitle,
  onStartEditing,
  onSaveTitle,
  loading,
  collapsed = false
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Button 
          onClick={onNewChat} 
          className={cn(
            "flex-1",
            collapsed && "p-2 h-auto"
          )}
        >
          <Plus className="h-5 w-5 mr-2" />
          {!collapsed && "New Chat"}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">
              No chat history
            </p>
          ) : (
            sessions.map(session => (
              <div
                key={session._id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg",
                  "px-3 py-2 text-sm",
                  currentSessionId === session._id ? "bg-muted" : "hover:bg-muted/50",
                  "cursor-pointer transition-colors"
                )}
                onClick={() => onSelectSession(session._id)}
              >
                <MessageSquare className="flex-shrink-0 h-4 w-4" />
                
                {!collapsed && (
                  <>
                    {isEditing === session._id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="h-6 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveTitle(session._id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{session.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartEditing(session._id, session.title);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
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
