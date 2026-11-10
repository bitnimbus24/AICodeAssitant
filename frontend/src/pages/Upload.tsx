import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, AlertCircle, FileArchive } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileUploadBox } from "@/components/upload/FileUploadBox";
import { UploadProgress, UploadStep } from "@/components/upload/UploadProgress";
import { Button } from "@/components/ui/button";
import { uploadRepo, UploadResult } from "@/lib/api";

interface UploadLocationState {
  file?: File;
}

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as UploadLocationState | null)?.file ?? null;

  const [file, setFile] = useState<File | null>(preselected);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>("uploading");
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setError(null);
    setIsUploading(true);
    setCurrentStep("uploading");
    setProgress(0);

    try {
      const response = await uploadRepo(file, (percent) => {
        setProgress(percent);
        if (percent >= 100) {
          // Upload finished; the server is now embedding and indexing.
          setCurrentStep("embedding");
        }
      });

      setResult(response);
      setProgress(100);
      setCurrentStep("completed");
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen px-6 py-12 lg:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upload Your Repository
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Drop your codebase and we'll analyze, embed, and index it for
              intelligent Q&A
            </p>
          </div>

          {isComplete ? (
            // Success State
            <div className="glass-card p-8 md:p-12 text-center animate-scale-in glow-primary">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Repository Indexed Successfully
              </h2>
              <p className="text-muted-foreground mb-4">
                Your codebase is ready. Start asking questions now!
              </p>
              {result && (
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-8">
                  <span className="flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4" />
                    {result.repo}
                  </span>
                  <span>{result.files_indexed} files indexed</span>
                  <span>{result.chunks_added} chunks embedded</span>
                </div>
              )}
              <Button variant="hero" size="lg" onClick={() => navigate("/chat")}>
                Start Chatting
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ) : isUploading ? (
            // Upload Progress
            <div className="animate-fade-in">
              <UploadProgress currentStep={currentStep} progress={progress} />
            </div>
          ) : (
            // Upload Form
            <div className="space-y-6 animate-fade-in">
              <FileUploadBox onFileSelect={handleFileSelect} />

              {error && (
                <div className="glass-card p-4 border border-destructive/40 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Upload failed</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}

              {file && (
                <div className="flex justify-center animate-fade-in">
                  <Button variant="hero" size="lg" onClick={handleUpload}>
                    Upload & Process
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {!isUploading && !isComplete && (
            <div className="mt-12 glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-semibold text-foreground mb-4">Tips for best results</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Upload a .zip of your project; generated folders like node_modules and .git are skipped automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Only source and text files are indexed — binary assets are ignored
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Up to 250 code chunks are indexed per upload; large repositories take a minute or two to embed
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
