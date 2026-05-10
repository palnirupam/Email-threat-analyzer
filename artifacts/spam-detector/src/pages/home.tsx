import { useState, useRef } from "react";
import { AnalysisForm } from "@/components/spam-detector/analysis-form";
import { ResultsPanel } from "@/components/spam-detector/results-panel";
import { HistoryPanel } from "@/components/spam-detector/history-panel";
import { HighlightedEmailBody } from "@/components/spam-detector/highlighted-email-body";
import { useHistory, type AnalysisHistory } from "@/hooks/use-history";
import { useAnalyzeSpam, type EmailInput, type SpamAnalysis } from "@workspace/api-client-react";
import { Shield, ScanSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentResult, setCurrentResult] = useState<SpamAnalysis | null>(null);
  const [currentInput, setCurrentInput] = useState<{ sender: string; subject: string }>({ sender: "", subject: "" });
  const [analyzedBody, setAnalyzedBody] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const scanStartRef = useRef<number>(0);
  const MIN_SCAN_MS = 1400; // minimum time the scanner is shown
  
  const { history, addHistory, deleteHistory, clearHistory } = useHistory();
  const { toast } = useToast();
  
  const analyzeMutation = useAnalyzeSpam();

  const handleAnalyze = (data: EmailInput) => {
    setIsScanning(true);
    scanStartRef.current = Date.now();
    analyzeMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          const elapsed = Date.now() - scanStartRef.current;
          const remaining = Math.max(0, MIN_SCAN_MS - elapsed);
          setTimeout(() => {
            setCurrentResult(result);
            setCurrentInput({ sender: data.sender_email, subject: data.subject });
            setAnalyzedBody(data.email_body ?? "");
            setIsScanning(false);
            addHistory({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              subject: data.subject,
              sender: data.sender_email,
              result,
            });
          }, remaining);
        },
        onError: () => {
          setIsScanning(false);
          toast({
            title: "Analysis Failed",
            description: "An unexpected error occurred during analysis.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleClear = () => {
    setCurrentResult(null);
    setCurrentInput({ sender: "", subject: "" });
    setAnalyzedBody("");
  };

  const handleHistorySelect = (item: AnalysisHistory) => {
    setCurrentResult(item.result);
    setCurrentInput({ sender: item.sender, subject: item.subject });
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground dark selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-mono font-bold tracking-widest uppercase">Spam Detector</h1>
          <div className="ml-auto flex items-center gap-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-7 bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="mb-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold tracking-tight mb-2">Input Source Data</h2>
              <p className="text-muted-foreground text-sm font-mono opacity-80">Provide raw email attributes for forensic classification.</p>
            </div>
            
            <AnalysisForm 
              onSubmit={handleAnalyze} 
              onClear={handleClear} 
              isLoading={analyzeMutation.isPending} 
            />

            {/* Keyword Highlight Panel — shown after analysis */}
            {analyzedBody && currentResult && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <ScanSearch className="h-4 w-4 text-primary" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Threat Keyword Analysis
                  </h3>
                </div>
                <HighlightedEmailBody text={analyzedBody} />
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 sticky top-8 h-[calc(100vh-8rem)]">
            <ResultsPanel 
              analysis={currentResult} 
              sender={currentInput.sender} 
              subject={currentInput.subject}
              isLoading={isScanning}
            />
          </div>
          
        </div>
      </main>

      {/* History Flyout */}
      <HistoryPanel 
        history={history} 
        onSelect={handleHistorySelect}
        onDelete={deleteHistory}
        onClear={clearHistory}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
    </div>
  );
}
