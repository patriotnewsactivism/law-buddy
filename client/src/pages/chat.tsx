import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, BookOpen } from "lucide-react";
import type { ChatMessage, Case } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: cases } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", selectedCaseId || "general"],
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chat", {
        content,
        caseId: selectedCaseId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;
    sendMessage.mutate(message);
  };

  const activeCases = cases?.filter((c) => c.status === "active") || [];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Legal Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Get expert legal guidance and document analysis
          </p>
        </div>
      </div>

      {/* Case Context Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Case Context:</label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="w-[300px]" data-testid="select-case-context">
                <SelectValue placeholder="General (no specific case)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">General (no specific case)</SelectItem>
                {activeCases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCaseId && (
              <Badge variant="secondary">
                {activeCases.find((c) => c.id === selectedCaseId)?.jurisdiction}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Ask legal questions, request document analysis, or get help with
                  compliance checking
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-3 w-3" />
                          <span className="text-xs font-medium">Sources:</span>
                        </div>
                        <div className="space-y-1">
                          {msg.sources.map((source: any, idx: number) => (
                            <p key={idx} className="text-xs font-mono">
                              {source}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Textarea
              placeholder="Ask a legal question or request document analysis..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="min-h-[60px] resize-none"
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
