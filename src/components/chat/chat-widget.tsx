"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Send, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageRenderer } from "./chat-message-renderer";
import type { ChatMessage, ChatService, ChatTimeSlot, ChatUICallbacks } from "./types";

interface ChatWidgetProps {
  companySlug: string;
  primaryColor?: string;
}

const STORAGE_KEY_PREFIX = "chat-session-";

export function ChatWidget({ companySlug, primaryColor }: ChatWidgetProps) {
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${companySlug}`;

  // Load chat history from API
  const loadChatHistory = useCallback(
    async (storedSessionId: string) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/c/${companySlug}/chat/history?sessionId=${storedSessionId}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            // Filter out system messages and only keep user/assistant messages
            const chatMessages = data.messages.filter(
              (m: ChatMessage) => m.role === "user" || m.role === "assistant"
            );
            setMessages([
              { role: "assistant", content: t("welcomeBack") },
              ...chatMessages,
            ]);
            setSessionId(storedSessionId);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Failed to load chat history:", error);
        return false;
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [companySlug, t]
  );

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem(storageKey);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, [storageKey]);

  // Load history when widget opens
  useEffect(() => {
    if (isOpen && !hasLoadedHistory) {
      setHasLoadedHistory(true);
      const storedSessionId = localStorage.getItem(storageKey);

      if (storedSessionId) {
        loadChatHistory(storedSessionId).then((hasHistory) => {
          if (!hasHistory) {
            // No history found, show welcome message
            setMessages([{ role: "assistant", content: t("welcome") }]);
            // Clear invalid session from localStorage
            localStorage.removeItem(storageKey);
            setSessionId(null);
          }
        });
      } else {
        // New user, show welcome message
        setMessages([{ role: "assistant", content: t("welcome") }]);
      }
    }
  }, [isOpen, hasLoadedHistory, storageKey, loadChatHistory, t]);

  // Save sessionId to localStorage when it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(storageKey, sessionId);
    }
  }, [sessionId, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start a new conversation
  const handleNewConversation = () => {
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setMessages([{ role: "assistant", content: t("welcome") }]);
  };

  // Send a message to the backend
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("errorMessage") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    await sendMessage(userMessage);
  }

  // UI Interaction handlers - these create synthetic user messages
  const handleServiceSelect = useCallback(
    (service: ChatService) => {
      sendMessage(`I'd like to book ${service.name}`);
    },
    [sendMessage]
  );

  const handleDateSelect = useCallback(
    (date: Date, _serviceId: string, serviceName: string) => {
      const formattedDate = format(date, "MMMM d, yyyy");
      sendMessage(`I'd like to book ${serviceName} on ${formattedDate}`);
    },
    [sendMessage]
  );

  const handleTimeSelect = useCallback(
    (slot: ChatTimeSlot, _serviceId: string, _dateISO: string, serviceName: string) => {
      sendMessage(`I'd like the ${slot.displayTime} slot for ${serviceName}`);
    },
    [sendMessage]
  );

  // Callbacks for UI components
  const uiCallbacks: ChatUICallbacks = {
    onServiceSelect: handleServiceSelect,
    onDateSelect: handleDateSelect,
    onTimeSelect: handleTimeSelect,
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          isOpen && "hidden"
        )}
        style={{ backgroundColor: primaryColor }}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
          <CardHeader
            className="flex flex-row items-center justify-between py-3 px-4"
            style={{ backgroundColor: primaryColor }}
          >
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("title")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                className="text-white hover:bg-white/20"
                title={t("newConversation")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loadingHistory")}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessageRenderer
                      key={index}
                      message={message}
                      isLatest={index === messages.length - 1}
                      callbacks={uiCallbacks}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("thinking")}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
