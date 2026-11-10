import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  code: string;
  language?: string;
}

export function CodeViewer({
  isOpen,
  onClose,
  fileName,
  code,
  language = "typescript",
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0 glass-card border-border overflow-hidden">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="font-mono text-sm text-foreground">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(80vh-80px)] p-4">
          <pre className="text-sm font-mono text-foreground leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
