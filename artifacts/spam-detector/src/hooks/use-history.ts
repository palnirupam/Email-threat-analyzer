import { useState, useEffect } from 'react';
import type { SpamAnalysis } from '@workspace/api-client-react';

const HISTORY_STORAGE_KEY = "spam_detector_history";

export interface AnalysisHistory {
  id: string;
  timestamp: number;
  subject: string;
  sender: string;
  email_body?: string;
  result: SpamAnalysis;
}

function readHistoryFromStorage(): AnalysisHistory[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistoryToStorage(history: AnalysisHistory[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage may be full or disabled; keep history in memory only.
  }
}

function removeHistoryFromStorage() {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Storage may be disabled.
  }
}

export function useHistory() {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);

  useEffect(() => {
    setHistory(readHistoryFromStorage());
  }, []);

  const addHistory = (item: AnalysisHistory) => {
    setHistory(prev => {
      const newHistory = [item, ...prev].slice(0, 20);
      writeHistoryToStorage(newHistory);
      return newHistory;
    });
  };

  const deleteHistory = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      writeHistoryToStorage(newHistory);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    removeHistoryFromStorage();
  };

  return { history, addHistory, deleteHistory, clearHistory };
}
