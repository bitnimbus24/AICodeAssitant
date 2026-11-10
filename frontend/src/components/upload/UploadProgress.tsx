import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type UploadStep = "uploading" | "embedding" | "indexing" | "completed";

interface UploadProgressProps {
  currentStep: UploadStep;
  progress: number;
}

const steps: { key: UploadStep; label: string; description: string }[] = [
  { key: "uploading", label: "Uploading", description: "Transferring files to server" },
  { key: "embedding", label: "Embedding", description: "Generating code embeddings (can take a minute)" },
  { key: "indexing", label: "Indexing", description: "Building search index" },
  { key: "completed", label: "Completed", description: "Ready for questions" },
];

export function UploadProgress({ currentStep, progress }: UploadProgressProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="glass-card p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {steps[currentIndex]?.label}
          </span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "flex items-start gap-4 transition-opacity duration-300",
                isPending && "opacity-40"
              )}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 text-primary",
                    isPending && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 mt-2 transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={cn(
                    "font-medium transition-colors duration-300",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
