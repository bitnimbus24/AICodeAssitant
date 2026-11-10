import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Calendar, FileArchive, ArrowRight, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { deleteHistoryItem, getHistory } from "@/lib/history";

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function History() {
  const [items, setItems] = useState(() => getHistory());

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setItems(getHistory());
  };

  return (
    <MainLayout>
      <div className="min-h-screen px-6 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Conversation History
            </h1>
            <p className="text-muted-foreground">
              View and continue your previous conversations
            </p>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="glass-card-hover p-6 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileArchive className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.repoName}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {item.messagesCount} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(new Date(item.date))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm pl-13">{item.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete conversation for ${item.repoName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/chat?id=${item.id}`}>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {items.length === 0 && (
            <div className="glass-card p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No conversations yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload a repository and start asking questions
              </p>
              <Button asChild variant="hero">
                <Link to="/upload">
                  Upload Repository
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
