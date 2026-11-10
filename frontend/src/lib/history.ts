export interface HistoryItem {
  id: string;
  repoName: string;
  summary: string;
  messagesCount: number;
  date: string;
}

const STORAGE_KEY = "codeassist.history.v1";

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === "string")
      .map((item) => ({
        id: String(item.id),
        repoName: String(item.repoName ?? "repository"),
        summary: String(item.summary ?? ""),
        messagesCount: Number(item.messagesCount) || 0,
        date: String(item.date ?? new Date().toISOString()),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Record a question for a repository. One entry per repository is kept,
 * updated with the latest question and a running message count.
 */
export function recordConversation(repoName: string, question: string, messagesCount: number) {
  const items = getHistory();
  const existing = items.find((item) => item.repoName === repoName);

  if (existing) {
    existing.summary = question;
    existing.messagesCount = Math.max(existing.messagesCount, messagesCount);
    existing.date = new Date().toISOString();
  } else {
    items.push({
      id: crypto.randomUUID(),
      repoName,
      summary: question,
      messagesCount,
      date: new Date().toISOString(),
    });
  }

  saveHistory(items);
}

export function deleteHistoryItem(id: string) {
  saveHistory(getHistory().filter((item) => item.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
