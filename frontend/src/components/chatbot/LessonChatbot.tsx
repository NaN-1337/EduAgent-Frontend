import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { startChat, continueChat, ChatMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface LessonChatbotProps {
  lessonContent: string;
  subject: string;
  grade: number;
  lessonId: string;
  studentId: string;
}

export interface LessonChatbotRef {
  sendMessage: (message: string) => Promise<void>;
}

export const LessonChatbot = forwardRef<LessonChatbotRef, LessonChatbotProps>(({
  lessonContent,
  subject,
  grade,
  lessonId,
  studentId,
}, ref) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem(`chat_session_${lessonId}_${studentId}`);
    if (savedSession) {
      try {
        const { sessionId: savedSessionId, messages: savedMessages } = JSON.parse(savedSession);
        setSessionId(savedSessionId);
        setMessages(savedMessages || []);
      } catch (error) {
        console.error("Error loading saved chat session:", error);
      }
    }
  }, [lessonId, studentId]);

  // Save session to localStorage
  const saveSession = (sessionId: string, messages: ChatMessage[]) => {
    localStorage.setItem(
      `chat_session_${lessonId}_${studentId}`,
      JSON.stringify({ sessionId, messages })
    );
  };

  // Character-by-character typing animation
  const typeMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      let currentIndex = 0;
      const typingSpeed = 20; // milliseconds per character
      
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          const char = text[currentIndex];
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = text.substring(0, currentIndex + 1);
            }
            return newMessages;
          });
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          resolve();
        }
      }, typingSpeed);
    });
  };

  const sendMessageInternal = async (messageText: string) => {
    if (!messageText.trim() || isLoading || isTyping) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageText.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let response;

      if (!sessionId) {
        // Validate required fields for new session
        if (!lessonContent || !lessonContent.trim()) {
          throw new Error("Lesson content is missing. Please refresh the page.");
        }
        if (!subject || !subject.trim()) {
          throw new Error("Subject is missing. Please refresh the page.");
        }
        if (!grade || (typeof grade !== 'number' && isNaN(Number(grade)))) {
          throw new Error("Grade is missing or invalid. Please refresh the page.");
        }

        // Start new chat session
        // Convert subject to lowercase if needed (API expects lowercase for vector store)
        const subjectForAPI = subject.trim().toLowerCase();
        
        response = await startChat({
          lesson_content: lessonContent.trim(),
          user_prompt: userMessage.content,
          subject: subjectForAPI,
          user_role: "student",
          grade: typeof grade === 'number' ? grade : Number(grade),
        });
        setSessionId(response.session_id);
      } else {
        // Continue existing session
        response = await continueChat({
          session_id: sessionId,
          user_prompt: userMessage.content,
        });
      }

      // Type the response character by character
      await typeMessage(response.response);

      // Save the complete conversation
      const finalMessages: ChatMessage[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: response.response,
          timestamp: Date.now(),
        },
      ];
      
      saveSession(response.session_id, finalMessages);
      
    } catch (error: any) {
      console.error("Chat error:", error);
      
      // Show error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: t.student.chatbot?.errorMessage || "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      if (sessionId) {
        saveSession(sessionId, finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput("");
    await sendMessageInternal(messageText);
  };

  // Expose sendMessage via ref
  useImperativeHandle(ref, () => ({
    sendMessage: sendMessageInternal,
  }));

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  {t.student.chatbot?.welcomeMessage ||
                    "Hi! I'm here to help you understand this lesson. Feel free to ask me any questions! 😊"}
                </p>
              </Card>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {(isLoading || isTyping) && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-muted-foreground text-xs">
                      {isLoading ? "Thinking..." : "Typing..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input - Always visible at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.student.chatbot?.inputPlaceholder || "Type your question..."}
            disabled={isLoading || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isTyping}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

LessonChatbot.displayName = "LessonChatbot";

