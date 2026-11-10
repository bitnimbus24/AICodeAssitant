import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, Zap, Database, Code2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "how-it-works",
    icon: Zap,
    title: "How It Works",
    content: `Our AI Codebase Assistant uses a sophisticated pipeline to understand and answer questions about your code:

1. **Upload**: You upload your repository as a .zip file
2. **Parsing**: We extract and parse all source files
3. **Chunking**: Code is split into semantic chunks
4. **Embedding**: Each chunk is converted to a vector embedding
5. **Indexing**: Embeddings are stored in a vector database
6. **Query**: Your questions are matched against relevant code
7. **Response**: AI generates contextual answers`,
  },
  {
    id: "embedding-rag",
    icon: Database,
    title: "Embedding & RAG Pipeline",
    content: `The system uses Retrieval-Augmented Generation (RAG) to provide accurate answers:

**Embedding Model**
We use state-of-the-art code embeddings that understand programming concepts, variable names, and code structure better than generic text embeddings.

**Vector Search**
When you ask a question, we:
- Convert your query to a vector
- Find the most similar code chunks
- Retrieve surrounding context
- Pass relevant code to the LLM

**Chunking Strategy**
Code is chunked at logical boundaries:
- Function definitions
- Class definitions
- Import statements
- Configuration blocks

This ensures context is preserved and answers are more accurate.`,
  },
  {
    id: "api-usage",
    icon: Code2,
    title: "API Usage",
    content: `You can call the local backend directly. The API runs at http://localhost:8000 (interactive docs at http://localhost:8000/docs).

\`\`\`bash
# Upload a repository (.zip) or a single source file
curl -X POST http://localhost:8000/upload/ \\
  -F "file=@repository.zip"

# Ask a question about the indexed code
curl -X POST http://localhost:8000/generate/ \\
  -H "Content-Type: application/json" \\
  -d '{"query": "How does auth work?"}'

# Semantic search over the indexed code
curl "http://localhost:8000/search/?q=authentication&k=5"
\`\`\`

**Notes**
- The backend must be running on port 8000.
- Each upload replaces the previously indexed repository.
- \`/generate/\` returns \`answer\`; \`/search/\` returns matching chunks with \`path\` and \`score\`.`,

  },
];

export default function Docs() {
  return (
    <MainLayout>
      <div className="min-h-screen px-6 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Documentation
                </h1>
                <p className="text-muted-foreground">
                  Learn how to use the AI Codebase Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass-card p-6 mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="font-semibold text-foreground mb-4">Quick Navigation</h2>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="px-4 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="glass-card p-8 animate-fade-in"
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                </div>

                <div className="prose prose-invert max-w-none">
                  {section.content.split("\n\n").map((paragraph, i) => {
                    // Handle code blocks
                    if (paragraph.startsWith("```")) {
                      const lines = paragraph.split("\n");
                      const lang = lines[0].replace("```", "");
                      const code = lines.slice(1, -1).join("\n");
                      return (
                        <pre
                          key={i}
                          className="bg-background/50 rounded-lg p-4 overflow-x-auto my-4"
                        >
                          <code className="text-sm font-mono text-foreground">
                            {code}
                          </code>
                        </pre>
                      );
                    }

                    // Handle headings
                    if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                      return (
                        <h3
                          key={i}
                          className="text-lg font-semibold text-foreground mt-6 mb-3"
                        >
                          {paragraph.replace(/\*\*/g, "")}
                        </h3>
                      );
                    }

                    // Handle list items
                    if (paragraph.includes("\n-")) {
                      const items = paragraph.split("\n").filter((line) => line.startsWith("-"));
                      return (
                        <ul key={i} className="list-disc list-inside space-y-1 text-muted-foreground">
                          {items.map((item, j) => (
                            <li key={j}>{item.replace("- ", "")}</li>
                          ))}
                        </ul>
                      );
                    }

                    // Handle numbered lists
                    if (/^\d\./.test(paragraph)) {
                      const items = paragraph.split("\n").filter((line) => /^\d\./.test(line));
                      return (
                        <ol key={i} className="list-decimal list-inside space-y-2 text-muted-foreground">
                          {items.map((item, j) => (
                            <li key={j}>
                              {item
                                .replace(/^\d\.\s*/, "")
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .split("<strong>")
                                .map((part, k) =>
                                  part.includes("</strong>") ? (
                                    <strong key={k} className="text-foreground">
                                      {part.replace("</strong>", "")}
                                    </strong>
                                  ) : (
                                    part
                                  )
                                )}
                            </li>
                          ))}
                        </ol>
                      );
                    }

                    // Regular paragraphs with inline formatting
                    return (
                      <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                        {paragraph.split(/(`[^`]+`)/).map((part, j) =>
                          part.startsWith("`") && part.endsWith("`") ? (
                            <code
                              key={j}
                              className="px-1.5 py-0.5 rounded bg-secondary text-primary text-sm font-mono"
                            >
                              {part.slice(1, -1)}
                            </code>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 glass-card p-8 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Ready to try it out?
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload your first repository and experience the power of AI-assisted code exploration
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/upload">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
