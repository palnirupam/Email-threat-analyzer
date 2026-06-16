import { useState, useEffect } from 'react';
import type { SpamAnalysis } from '@workspace/api-client-react';

export interface AnalysisHistory {
  id: string;
  timestamp: number;
  subject: string;
  sender: string;
  email_body?: string;
  result: SpamAnalysis;
}

export function useHistory() {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("spam_detector_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const addHistory = (item: AnalysisHistory) => {
    setHistory(prev => {
      const newHistory = [item, ...prev].slice(0, 20);
      try {
        localStorage.setItem("spam_detector_history", JSON.stringify(newHistory));
      } catch {
        // Storage full or disabled — history works in-memory only
      }
      return newHistory;
    });
  };

  const deleteHistory = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem("spam_detector_history", JSON.stringify(newHistory));
      } catch {
        // Storage full or disabled
      }
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("spam_detector_history");
  };

  return { history, addHistory, deleteHistory, clearHistory };
}
