import type { SpamAnalysis } from "@workspace/api-client-react";
import { exportAsCsv, exportAsTxt, exportAsHtml, exportAsPdf } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, CheckCircle, Copy, Check, ChevronDown, Download, FileText, FileCode, ShieldAlert, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ResultsPanelProps {
  analysis: SpamAnalysis | null;
  sender: string;
  subject: string;
  isLoading?: boolean;
}
const CATEGORY_COLORS: Record<string, string> = {
  "Financial Lure":    "#ef4444",
  "Phishing":          "#f97316",
  "Personal Data":     "#ef4444",
  "Brand Spoofing":    "#f97316",
  "Marketing Spam":    "#f59e0b",
  "Urgency Language":  "#f59e0b",
  "Suspicious Links":  "#eab308",
  "Adult/Gambling":    "#a855f7",
  "Crypto Scam":       "#8b5cf6",
  "Health Scam":       "#ec4899",
  "Sender Reputation": "#6366f1",
  "Content Structure": "#64748b",
  "Attachments":       "#dc2626",
};

function ScoreBreakdownChart({ breakdown }: { breakdown: SpamAnalysis["score_breakdown"] }) {
  if (!breakdown || breakdown.length === 0) return null;

  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Score Breakdown
      </h3>
      <div className="space-y-2.5">
        {breakdown.map((item) => {
          const pct = Math.min((item.score / item.max_score) * 100, 100);
          const color = CATEGORY_COLORS[item.category] ?? "#64748b";
          return (
            <div key={item.category}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs text-muted-foreground">{item.category}</span>
                <span className="font-mono text-xs font-semibold tabular-nums" style={{ color }}>
                  {item.score}
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ analysis, sender, subject }: { analysis: SpamAnalysis; sender: string; subject: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines = [
      "═══ Email Threat Analysis Report ═══",
      `Verdict    : ${analysis.isSpam ? "⚠ SPAM" : "✓ CLEAN"}`,
      `Threat Score: ${analysis.spam_score}/100`,
      `Confidence : ${Math.round(analysis.confidence * 100)}%`,
      `Subject    : ${subject || "N/A"}`,
      `Sender     : ${sender || "N/A"}`,
      "",
      "Risk Factors:",
      ...(analysis.risk_factors.length > 0
        ? analysis.risk_factors.map((r) => `  • ${r}`)
        : ["  None detected"]),
      "",
      "Category Breakdown:",
      ...analysis.score_breakdown.map((b) => `  ${b.category.padEnd(20)} ${b.score}/${b.max_score}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lines.join("\n");
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className={`h-8 font-mono text-xs transition-colors ${copied ? "border-emerald-500/50 text-emerald-500" : ""}`}
      onClick={handleCopy}
    >
      {copied ? (
        <><Check className="mr-1.5 h-3 w-3" />Copied!</>
      ) : (
        <><Copy className="mr-1.5 h-3 w-3" />Copy</>
      )}
    </Button>
  );
}

const SCAN_STEPS = [
  "Parsing email headers...",
  "Scanning phrase patterns...",
  "Analyzing URL signatures...",
  "Running Bayesian classifier...",
  "Generating threat verdict...",
];

function ScanningPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center min-h-[400px] border border-primary/30 rounded-lg bg-card overflow-hidden relative">
      {/* Sweeping scanline */}
      <div
        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
        style={{
          animation: "scanline 0.8s linear infinite",
          top: 0,
        }}
      />
      <style>{`
        @keyframes scanline {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeInStep {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
      `}</style>

      <ScanLine className="h-8 w-8 text-primary mb-5 animate-pulse" />
      <p className="font-mono text-xs uppercase tracking-widest text-primary mb-6">Scanning</p>

      <div className="space-y-2 text-left w-56">
        {SCAN_STEPS.map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
            style={{
              opacity: 0,
              animation: `fadeInStep 0.18s ease forwards`,
              animationDelay: `${i * 0.09}s`,
            }}
          >
            <span className="text-primary">›</span>
            {step}
          </div>
        ))}
        {/* Blinking cursor on last line */}
        <span
          className="inline-block w-2 h-3 bg-primary ml-4"
          style={{ animation: "blink 0.7s step-start infinite" }}
        />
      </div>
    </div>
  );
}

export function ResultsPanel({ analysis, sender, subject, isLoading }: ResultsPanelProps) {
  if (isLoading) return <ScanningPanel />;

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[400px] border border-dashed border-border rounded-lg bg-card/50">
        <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
        <p className="font-mono text-sm uppercase tracking-widest">Awaiting Input Data</p>
        <p className="text-xs opacity-60 mt-2">Submit an email to view forensic analysis</p>
      </div>
    );
  }

  const { isSpam, confidence, spam_score, risk_factors, score_breakdown, details } = analysis;

  const scoreColor = spam_score > 70 ? "bg-destructive" : spam_score > 40 ? "bg-amber-500" : "bg-emerald-500";
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Header Verdict */}
      <div className={`p-6 border-b border-border ${isSpam ? "bg-destructive/10" : "bg-emerald-500/10"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Verdict</h2>
          <div className="flex items-center gap-2">
            <CopyButton analysis={analysis} sender={sender} subject={subject} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 font-mono text-xs">
                  <Download className="mr-1.5 h-3 w-3" />
                  Export
                  <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono text-xs">
                <DropdownMenuItem onClick={() => exportAsCsv(analysis, sender, subject)}>
                  <Download className="mr-2 h-3.5 w-3.5" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsTxt(analysis, sender, subject)}>
                  <FileText className="mr-2 h-3.5 w-3.5" /> TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsHtml(analysis, sender, subject)}>
                  <FileCode className="mr-2 h-3.5 w-3.5" /> HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsPdf(analysis, sender, subject)}>
                  <FileText className="mr-2 h-3.5 w-3.5" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isSpam ? (
            <AlertTriangle className="h-10 w-10 text-destructive" />
          ) : (
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          )}
          <div>
            <div className={`text-3xl font-bold tracking-tight ${isSpam ? "text-destructive" : "text-emerald-500"}`}>
              {isSpam ? "THREAT DETECTED" : "CLEAN"}
            </div>
            <p className="font-mono text-sm mt-1 opacity-80">Confidence: {confidencePercent}%</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 flex-1 overflow-y-auto space-y-8">

        {/* Overall Threat Score bar */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Overall Threat Score</span>
            <span className="font-mono font-bold">{spam_score} / 100</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreColor} transition-all duration-1000 ease-out`}
              style={{ width: `${spam_score}%` }}
            />
          </div>
        </div>

        {/* Score Breakdown Chart */}
        <ScoreBreakdownChart breakdown={score_breakdown} />

        {/* Risk Factors */}
        {risk_factors.length > 0 && (
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">Identified Risks</h3>
            <ul className="space-y-2">
              {risk_factors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded border border-border/50">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Forensic Details */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">Forensic Details</h3>

          {details.sender_reputation_warning && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <span className="font-mono text-xs text-destructive block mb-1">Reputation Warning</span>
              <span className="text-sm">{details.sender_reputation_warning}</span>
            </div>
          )}

          {details.suspicious_keywords.length > 0 && (
            <div>
              <span className="font-mono text-xs text-muted-foreground block mb-2">Flagged Keywords</span>
              <div className="flex flex-wrap gap-2">
                {details.suspicious_keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="font-mono bg-background text-amber-500 border-amber-500/30">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {details.email_structure_issues.length > 0 && (
            <div>
              <span className="font-mono text-xs text-muted-foreground block mb-2">Structural Anomalies</span>
              <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground space-y-1">
                {details.email_structure_issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {details.detected_attachments && details.detected_attachments.length > 0 && (
            <div>
              <span className="font-mono text-xs text-muted-foreground block mb-2">Analyzed Attachments</span>
              <div className="flex flex-wrap gap-2">
                {details.detected_attachments.map((att, i) => (
                  <Badge key={i} variant="secondary" className="font-mono">
                    {att}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
