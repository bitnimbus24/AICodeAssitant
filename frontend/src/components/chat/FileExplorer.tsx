import { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile?: string;
  onFileSelect: (path: string) => void;
}

function getFileIcon(name: string) {
  if (name.endsWith(".json")) return FileJson;
  if (name.endsWith(".md") || name.endsWith(".txt")) return FileText;
  return FileCode;
}

function FileTreeItem({
  node,
  depth = 0,
  selectedFile,
  onFileSelect,
}: {
  node: FileNode;
  depth?: number;
  selectedFile?: string;
  onFileSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFolder = node.type === "folder";
  const isSelected = selectedFile === node.path;

  const Icon = isFolder
    ? isOpen
      ? FolderOpen
      : Folder
    : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          } else {
            onFileSelect(node.path);
          }
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
          "hover:bg-secondary/50",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder && (
          <span className="text-muted-foreground">
            {isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        <Icon
          className={cn(
            "w-4 h-4 shrink-0",
            isFolder ? "text-primary" : "text-muted-foreground",
            isSelected && "text-primary"
          )}
        />
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  return (
    <div className="glass-card h-full overflow-hidden flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Repository Files</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No files uploaded yet</p>
          </div>
        ) : (
          files.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
