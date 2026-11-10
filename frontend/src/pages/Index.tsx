import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Code2, Zap, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileUploadBox } from "@/components/upload/FileUploadBox";

const features = [
  {
    icon: Code2,
    title: "Smart Code Analysis",
    description: "Deep understanding of your codebase structure and patterns",
  },
  {
    icon: Zap,
    title: "Instant Answers",
    description: "Get accurate responses about your code in milliseconds",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your code never leaves our secure infrastructure",
  },
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "Ask questions in plain English, get expert insights",
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Powered by Advanced RAG Pipeline
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="gradient-text">AI Codebase</span>
                <br />
                <span className="text-foreground">Assistant</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Upload your repository. Ask anything about your code. Get instant,
                intelligent answers powered by state-of-the-art AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild variant="hero" size="xl">
                  <Link to="/upload">
                    Start Asking Questions
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link to="/docs">Learn How It Works</Link>
                </Button>
              </div>
            </div>

            {/* Upload Preview */}
            <div
              className="max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <FileUploadBox
                onFileSelect={(file) => {
                  navigate("/upload", { state: { file } });
                }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Everything you need to understand your code
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Powerful features designed for developers who want instant insights
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="glass-card-hover p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card p-8 md:p-12 glow-primary">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to explore your codebase?
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload your repository and start asking questions in seconds.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/upload">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
