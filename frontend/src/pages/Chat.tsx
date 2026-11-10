import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileExplorer } from "@/components/chat/FileExplorer";
import { CodeViewer } from "@/components/code/CodeViewer";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft, AlertCircle } from "lucide-react";
import {
  askQuestion,
  buildFileTree,
  getFileContent,
  getRepoInfo,
  FileNode,
} from "@/lib/api";
import { recordConversation } from "@/lib/history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! Ask me anything about your indexed codebase — from what a specific function does to how the project is structured.",
  timestamp: new Date(),
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState({ name: "", code: "" });
  const [repoName, setRepoName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getRepoInfo()
      .then((info) => {
        if (cancelled) return;
        setRepoName(info.repo);
        setFiles(buildFileTree(info.files));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load repository info.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { answer } = await askQuestion(content);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          timestamp: new Date(),
        },
      ]);
      recordConversation(repoName ?? "repository", content, messages.length + 2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `**Error:** ${message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (path: string) => {
    const name = path.split("/").pop() || path;
    setSelectedFile(path);
    setViewingFile({ name, code: "Loading..." });
    setCodeViewerOpen(true);

    try {
      const { content } = await getFileContent(path);
      setViewingFile({ name, code: content });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load file.";
      setViewingFile({ name, code: `// ${message}` });
    }
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-semibold text-foreground">Chat with your code</h1>
            <p className="text-sm text-muted-foreground">
              {repoName ?? "No repository indexed"}
              {files.length > 0 ? ` · ${files.length} top-level entries` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="hidden lg:flex"
          >
            {showFileExplorer ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </Button>
        </header>

        {loadError && (
          <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/30 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {loadError}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer */}
          {showFileExplorer && (
            <aside className="hidden lg:block w-72 border-r border-border shrink-0">
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
              />
            </aside>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <ChatInput
                onSend={handleSend}
                onAttach={() => setShowFileExplorer(true)}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      <CodeViewer
        isOpen={codeViewerOpen}
        onClose={() => setCodeViewerOpen(false)}
        fileName={viewingFile.name}
        code={viewingFile.code}
      />
    </MainLayout>
  );
}
