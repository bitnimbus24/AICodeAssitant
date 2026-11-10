import { useState, useCallback } from "react";
import { Upload, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadBoxProps {
  onFileSelect: (file: File) => void;
  className?: string;
  compact?: boolean;
}

export function FileUploadBox({ onFileSelect, className, compact = false }: FileUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const isZip = name.endsWith(".zip");
    const isSource = /\.(py|js|jsx|ts|tsx|mjs|cjs|java|kt|go|rs|rb|php|c|h|cpp|hpp|cs|swift|sh|ps1|sql|html|css|scss|json|ya?ml|toml|md|txt|xml)$/.test(name);
    if (!isZip && !isSource) {
      setError("Please upload a .zip archive or a source code file");
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB");
      return false;
    }
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  return (
    <div
      className={cn(
        "relative group",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
        onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".zip,.py,.js,.jsx,.ts,.tsx,.mjs,.cjs,.java,.kt,.go,.rs,.rb,.php,.c,.h,.cpp,.hpp,.cs,.swift,.sh,.ps1,.sql,.html,.css,.scss,.json,.yaml,.yml,.toml,.md,.txt,.xml"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div
        className={cn(
          "glass-card border-2 border-dashed transition-all duration-300",
          compact ? "p-6" : "p-12",
          isDragging
            ? "border-primary bg-primary/5 glow-primary"
            : "border-border hover:border-primary/50",
          file && "border-primary/50 bg-primary/5"
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {file ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileArchive className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex items-center gap-2 mt-3 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Ready to upload</span>
              </div>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "rounded-2xl bg-secondary flex items-center justify-center mb-4 transition-transform duration-300",
                  compact ? "w-12 h-12" : "w-16 h-16",
                  isDragging && "scale-110"
                )}
              >
                <Upload
                  className={cn(
                    "text-muted-foreground transition-colors",
                    compact ? "w-6 h-6" : "w-8 h-8",
                    isDragging && "text-primary"
                  )}
                />
              </div>
              <p className={cn("font-medium text-foreground mb-1", compact && "text-sm")}>
                Drop your repository here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse (.zip archive or source file)
              </p>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-4 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
