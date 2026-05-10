import { useState } from "react";
import type { AnalysisHistory } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { History, ShieldAlert, ShieldCheck, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryPanelProps {
  history: AnalysisHistory[];
  onSelect: (item: AnalysisHistory) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

type ConfirmState =
  | { type: "none" }
  | { type: "delete"; id: string; subject: string }
  | { type: "clear" };

// ─── Mini Sparkline Chart ─────────────────────────────────────────────────────
function SparklineChart({ history }: { history: AnalysisHistory[] }) {
  if (history.length < 2) return null;

  const W = 240;
  const H = 52;
  const PAD = 6;
  // Reverse so oldest is on the left
  const scores = [...history].reverse().map((h) => h.result.spam_score);
  const n = scores.length;

  const xPos = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const yPos = (s: number) => H - PAD - (s / 100) * (H - PAD * 2);

  const polyPoints = scores.map((s, i) => `${xPos(i).toFixed(1)},${yPos(s).toFixed(1)}`).join(" ");

  // Area fill path
  const areaPath = [
    `M ${xPos(0).toFixed(1)},${yPos(scores[0]!).toFixed(1)}`,
    ...scores.slice(1).map((s, i) => `L ${xPos(i + 1).toFixed(1)},${yPos(s).toFixed(1)}`),
    `L ${xPos(n - 1).toFixed(1)},${H - PAD}`,
    `L ${xPos(0).toFixed(1)},${H - PAD}`,
    "Z",
  ].join(" ");

  const latestScore = scores[scores.length - 1] ?? 0;
  const latestIsSpam = latestScore > 48;

  return (
    <div className="px-3 pt-2 pb-3 border-b border-border bg-muted/20">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          Score Trend
        </span>
        <span className="font-mono text-[10px] tabular-nums" style={{ color: latestIsSpam ? "#ef4444" : "#22c55e" }}>
          Latest: {latestScore}/100
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Spam threshold line at score=48 */}
        <line
          x1={PAD} y1={yPos(48)} x2={W - PAD} y2={yPos(48)}
          stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="3,3"
        />
        <text x={W - PAD + 2} y={yPos(48) + 3} fontSize="7" fill="rgba(239,68,68,0.5)" fontFamily="monospace">48</text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#sparkGrad)" />

        {/* Line */}
        <polyline
          points={polyPoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots — only show for ≤12 points to avoid clutter */}
        {n <= 12 && scores.map((s, i) => (
          <circle
            key={i}
            cx={xPos(i)}
            cy={yPos(s)}
            r={i === n - 1 ? 3.5 : 2.5}
            fill={s > 48 ? "#ef4444" : "#22c55e"}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          >
            <title>{`Score: ${s}`}</title>
          </circle>
        ))}
      </svg>

      {/* X-axis labels: first and last */}
      <div className="flex justify-between mt-0.5">
        <span className="font-mono text-[9px] text-muted-foreground/50">
          {formatDistanceToNow(history[history.length - 1]!.timestamp, { addSuffix: true })}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/50">now</span>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function HistoryPanel({ history, onSelect, onDelete, onClear, isOpen, onToggle }: HistoryPanelProps) {
  const [confirm, setConfirm] = useState<ConfirmState>({ type: "none" });

  const handleConfirm = () => {
    if (confirm.type === "delete") {
      onDelete(confirm.id);
    } else if (confirm.type === "clear") {
      onClear();
    }
    setConfirm({ type: "none" });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl bg-primary text-primary-foreground font-mono text-xs font-semibold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all border border-primary"
      >
        <History className="h-4 w-4" />
        History {history.length > 0 && <span className="ml-0.5 opacity-80">({history.length})</span>}
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-2rem)] bg-card border border-border shadow-2xl rounded-xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-mono text-sm font-semibold tracking-wider uppercase">Local Logs</h3>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm({ type: "clear" })}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 font-mono uppercase tracking-wider"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Sparkline trend chart */}
        {history.length >= 2 && <SparklineChart history={history} />}

        {/* List */}
        <ScrollArea className="flex-1">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-xs">
              No historical data found.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                >
                  <button
                    onClick={() => onSelect(item)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.result.isSpam ? (
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">
                        {item.subject || "No Subject"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground mt-1">
                        {item.sender || "Unknown Sender"}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {/* Mini inline score badge */}
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: item.result.spam_score > 48 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                            color: item.result.spam_score > 48 ? "#ef4444" : "#22c55e",
                          }}
                        >
                          {item.result.spam_score}/100
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-60 font-mono uppercase">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirm({ type: "delete", id: item.id, subject: item.subject || "No Subject" });
                    }}
                    className="shrink-0 mt-0.5 p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirm.type !== "none"} onOpenChange={(open) => { if (!open) setConfirm({ type: "none" }); }}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wide">
              {confirm.type === "clear" ? "Clear All History?" : "Delete Entry?"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {confirm.type === "clear"
                ? "This will permanently remove all analysis history. This action cannot be undone."
                : confirm.type === "delete"
                ? <>Are you sure you want to delete <span className="text-foreground font-medium">"{confirm.subject}"</span>? This cannot be undone.</>
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirm({ type: "none" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {confirm.type === "clear" ? "Clear All" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
