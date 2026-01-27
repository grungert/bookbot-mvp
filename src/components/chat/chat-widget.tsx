"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Loader2, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageRenderer } from "./chat-message-renderer";
import { createRichMessageContent } from "./message-parser";
import { LimitModal, useLimitModal, type LimitType } from "@/components/subscription/limit-modal";
import type { ChatMessage, ChatService, ChatTimeSlot, ChatUICallbacks } from "./types";

interface InitData {
  greeting: string | null;
  services: ChatService[];
  language?: string;
}

function buildGreetingMessage(
  greeting: string | null,
  services: ChatService[],
  fallback: string
): string {
  const text = greeting || fallback;
  if (services.length > 0) {
    return createRichMessageContent(text, {
      component: "service-selector",
      props: { services },
    });
  }
  return text;
}

interface ChatWidgetProps {
  companySlug: string;
  primaryColor?: string;
  embedded?: boolean;
}

const STORAGE_KEY_PREFIX = "chat-session-";

export function ChatWidget({ companySlug, primaryColor, embedded = false }: ChatWidgetProps) {
  const t = useTranslations("chat");
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initDataRef = useRef<InitData | null>(null);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const skipAutoScrollRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Limit modal state
  const { modalState, showLimitModal, setModalOpen } = useLimitModal();

  const storageKey = `${STORAGE_KEY_PREFIX}${companySlug}`;

  // Fetch init data (greeting + services) from the server, cached in ref
  const fetchInitData = useCallback(async (): Promise<InitData | null> => {
    if (initDataRef.current) return initDataRef.current;
    try {
      const res = await fetch(`/api/c/${companySlug}/chat/init`);
      if (res.ok) {
        const data: InitData = await res.json();
        initDataRef.current = data;
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch chat init data:", error);
    }
    return null;
  }, [companySlug]);

  // Build and set the greeting message from init data (or fallback)
  const showGreeting = useCallback(async () => {
    const initData = await fetchInitData();
    const content = initData
      ? buildGreetingMessage(initData.greeting, initData.services, t("welcome"))
      : t("welcome");
    setMessages([{ role: "assistant", content, timestamp: new Date().toISOString() }]);
    setHasMoreMessages(false);
    setNextCursor(null);
  }, [fetchInitData, t]);

  // Load chat history from API
  const loadChatHistory = useCallback(
    async (storedSessionId: string) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/c/${companySlug}/chat/history?sessionId=${storedSessionId}&limit=30`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages([
              { role: "assistant", content: t("welcomeBack"), timestamp: new Date().toISOString() },
              ...data.messages,
            ]);
            setSessionId(storedSessionId);
            setHasMoreMessages(data.pagination?.hasMore ?? false);
            setNextCursor(data.pagination?.nextCursor ?? null);
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

  // Load more (older) messages
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const response = await fetch(
        `/api/c/${companySlug}/chat/history?sessionId=${sessionId}&limit=30&cursor=${nextCursor}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          skipAutoScrollRef.current = true;
          setMessages((prev) => {
            // Insert older messages after the synthetic welcome message (index 0)
            const welcomeMsg = prev[0];
            const rest = prev.slice(1);
            return [welcomeMsg, ...data.messages, ...rest];
          });
          setHasMoreMessages(data.pagination?.hasMore ?? false);
          setNextCursor(data.pagination?.nextCursor ?? null);

          // Preserve scroll position after prepending
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionId, nextCursor, isLoadingMore, companySlug]);

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
        // Fetch init data (language, services) in parallel with history
        fetchInitData();
        loadChatHistory(storedSessionId).then((hasHistory) => {
          if (!hasHistory) {
            // No history found, show greeting with services
            localStorage.removeItem(storageKey);
            setSessionId(null);
            showGreeting();
          }
        });
      } else {
        // New user, show greeting with services
        showGreeting();
      }
    }
  }, [isOpen, hasLoadedHistory, storageKey, loadChatHistory, showGreeting, fetchInitData]);

  // Save sessionId to localStorage when it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(storageKey, sessionId);
    }
  }, [sessionId, storageKey]);

  useEffect(() => {
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // Start a new conversation
  const handleNewConversation = () => {
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setHasMoreMessages(false);
    setNextCursor(null);
    showGreeting();
  };

  // Blur any focused element inside the chat scroll area so the browser
  // doesn't fight our scroll-to-bottom with its own focus-scroll behaviour.
  const blurChatFocus = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      container &&
      document.activeElement instanceof HTMLElement &&
      container.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
  }, []);

  // Send a message to the backend
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    blurChatFocus();
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          ...(sessionId === null && messages[0]?.role === "assistant"
            ? { greetingMessage: messages[0].content }
            : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle chat limit exceeded (429)
        if (response.status === 429 && errorData.code === "CHAT_LIMIT_EXCEEDED") {
          showLimitModal(
            "CHAT_LIMIT",
            errorData.currentUsage,
            errorData.limit,
            errorData.resetsAt ? new Date(errorData.resetsAt) : null
          );
          // Remove the user message we just added since it wasn't processed
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("errorMessage"), timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a structured booking action (bypasses LLM)
  const sendBookingAction = async (
    displayMessage: string,
    bookingAction: {
      type: string;
      serviceId?: string;
      serviceName?: string;
      date?: string;
      startTime?: string;
      confirmed?: boolean;
      action?: Record<string, unknown>;
    }
  ) => {
    if (isLoading) return;

    blurChatFocus();
    setMessages((prev) => [...prev, { role: "user", content: displayMessage, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: displayMessage,
          sessionId,
          bookingAction,
          ...(sessionId === null && messages[0]?.role === "assistant"
            ? { greetingMessage: messages[0].content }
            : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process booking action");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("errorMessage"), timestamp: new Date().toISOString() },
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
    inputRef.current?.focus();
    await sendMessage(userMessage);
  }

  // UI Interaction handlers - send structured booking actions (bypasses LLM)
  const handleServiceSelect = useCallback(
    (service: ChatService) => {
      sendBookingAction(`I'd like to book ${service.name}`, {
        type: "service",
        serviceId: service.id,
        serviceName: service.name,
      });
    },
    [sendBookingAction]
  );

  const handleDateSelect = useCallback(
    (date: Date, _serviceId: string, serviceName: string) => {
      const formattedDate = format(date, "MMMM d, yyyy");
      const dateISO = format(date, "yyyy-MM-dd");
      sendBookingAction(`I'd like to book ${serviceName} on ${formattedDate}`, {
        type: "date",
        date: dateISO,
      });
    },
    [sendBookingAction]
  );

  const handleTimeSelect = useCallback(
    (slot: ChatTimeSlot, _serviceId: string, dateISO: string, serviceName: string) => {
      const formattedDate = format(parseISO(dateISO), "MMMM d, yyyy");
      sendBookingAction(
        `I'd like the ${slot.displayTime} slot for ${serviceName} on ${formattedDate}`,
        {
          type: "time",
          startTime: slot.startTime,
        }
      );
    },
    [sendBookingAction]
  );

  const handleConfirmationClick = useCallback(
    (confirmed: boolean, action?: Record<string, unknown>) => {
      if (confirmed && action) {
        sendBookingAction(t("confirmYes") || "Yes", {
          type: "confirmation",
          confirmed: true,
          action,
        });
      } else {
        sendMessage(t("confirmNo") || "No");
      }
    },
    [sendBookingAction, sendMessage, t]
  );

  // Callbacks for UI components
  const uiCallbacks: ChatUICallbacks = {
    onServiceSelect: handleServiceSelect,
    onDateSelect: handleDateSelect,
    onTimeSelect: handleTimeSelect,
    onConfirmationClick: handleConfirmationClick,
  };

  // Load earlier messages button
  const LoadEarlierButton = () => {
    if (!hasMoreMessages) return null;
    return (
      <div className="flex justify-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={loadMoreMessages}
          disabled={isLoadingMore}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {isLoadingMore ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <ChevronUp className="h-3 w-3 mr-1" />
          )}
          {t("loadEarlierMessages")}
        </Button>
      </div>
    );
  };

  // Hide on admin pages (but not in embedded mode)
  if (!embedded && pathname.includes('/admin')) {
    return null;
  }

  // Embedded mode - render chat directly without toggle button
  if (embedded) {
    return (
      <div className="h-full w-full flex flex-col bg-card overflow-hidden">
        {/* Messages */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={scrollContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto p-4 space-y-4 [overflow-anchor:none]">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loadingHistory")}
                </div>
              </div>
            ) : (
              <>
                <LoadEarlierButton />
                {messages.map((message, index) => (
                  <ChatMessageRenderer
                    key={message.id || `synthetic-${index}`}
                    message={message}
                    nextMessage={messages[index + 1]}
                    isLatest={index === messages.length - 1}
                    callbacks={uiCallbacks}
                    language={initDataRef.current?.language}
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

          {/* Scroll to bottom */}
          {showScrollToBottom && (
            <Button
              variant="outline"
              size="icon"
              onClick={scrollToBottom}
              className="absolute bottom-2 right-4 h-8 w-8 rounded-full shadow-md bg-card z-10"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t flex gap-2 shrink-0 bg-card"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="text-white hover:opacity-90 [background-image:none]"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

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
        <div className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col rounded-xl border bg-card overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between py-3 px-4 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("title")}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                className="h-8 w-8 text-white hover:bg-white/20"
                title={t("newConversation")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 relative overflow-hidden">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto p-4 space-y-4 [overflow-anchor:none]">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loadingHistory")}
                  </div>
                </div>
              ) : (
                <>
                  <LoadEarlierButton />
                  {messages.map((message, index) => (
                    <ChatMessageRenderer
                      key={message.id || `synthetic-${index}`}
                      message={message}
                      nextMessage={messages[index + 1]}
                      isLatest={index === messages.length - 1}
                      callbacks={uiCallbacks}
                      language={initDataRef.current?.language}
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

            {/* Scroll to bottom */}
            {showScrollToBottom && (
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToBottom}
                className="absolute bottom-2 right-4 h-8 w-8 rounded-full shadow-md bg-card z-10"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t flex gap-2 shrink-0 bg-card"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Limit Modal */}
      <LimitModal
        open={modalState.open}
        onOpenChange={setModalOpen}
        limitType={modalState.limitType}
        currentUsage={modalState.currentUsage}
        limit={modalState.limit}
        resetsAt={modalState.resetsAt}
        onUpgrade={() => router.push("/pricing")}
      />
    </>
  );
}
