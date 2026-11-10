const rawBase = import.meta.env.VITE_API_URL as string | undefined;

/** Backend base URL. Override with VITE_API_URL if the API runs elsewhere. */
export const API_BASE = (rawBase?.replace(/\/+$/, "") || "http://127.0.0.1:8000");

export interface RepoFile {
  path: string;
  size: number;
}

export interface RepoInfo {
  repo: string | null;
  uploaded_at?: string | null;
  files: RepoFile[];
  chunks: number;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

export interface UploadResult {
  message: string;
  repo: string;
  files_indexed: number;
  chunks_added: number;
  files_skipped: number;
}

function extractError(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : JSON.stringify(item)))
      .join("; ");
  }
  if (detail) return JSON.stringify(detail);
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error(`Cannot reach the backend at ${API_BASE}. Is it running?`);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = extractError(body?.detail, message);
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function uploadRepo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload/`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // ignore parse errors
      }

      if (xhr.status >= 200 && xhr.status < 300 && body) {
        resolve(body as UploadResult);
      } else {
        const detail = (body as { detail?: unknown } | null)?.detail;
        reject(new Error(extractError(detail, `Upload failed (${xhr.status})`)));
      }
    };

    xhr.onerror = () => reject(new Error(`Cannot reach the backend at ${API_BASE}. Is it running?`));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function getRepoInfo(): Promise<RepoInfo> {
  return request<RepoInfo>("/files/");
}

export function getFileContent(path: string): Promise<{ path: string; content: string }> {
  return request(`/files/content?path=${encodeURIComponent(path)}`);
}

export function askQuestion(query: string): Promise<{ answer: string }> {
  return request("/generate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}

export function searchCode(
  query: string,
  k = 5
): Promise<{ query: string; results: { path: string; score: number; text: string }[] }> {
  return request(`/search/?q=${encodeURIComponent(query)}&k=${k}`);
}

export function clearRepository(): Promise<{ message: string }> {
  return request("/files/", { method: "DELETE" });
}

/** Convert a flat list of repo-relative paths into a folder/file tree. */
export function buildFileTree(files: RepoFile[]): FileNode[] {
  const root: FileNode[] = [];
  const folders = new Map<string, FileNode>();

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let level = root;
    let prefix = "";

    parts.forEach((part, index) => {
      prefix = prefix ? `${prefix}/${part}` : part;

      if (index === parts.length - 1) {
        level.push({ name: part, type: "file", path: file.path });
        return;
      }

      let folder = folders.get(prefix);
      if (!folder) {
        folder = { name: part, type: "folder", path: prefix, children: [] };
        folders.set(prefix, folder);
        level.push(folder);
      }
      level = folder.children!;
    });
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1
    );
    nodes.forEach((node) => node.children && sortNodes(node.children));
  };
  sortNodes(root);

  return root;
}
