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
      <div className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-card border border-border shadow-2xl rounded-xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
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
                      <div className="text-[10px] text-muted-foreground opacity-60 mt-2 font-mono uppercase">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
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
