import { useState } from "react";
import type { SpamAnalysis } from "@workspace/api-client-react";
import { ChevronDown, ChevronUp, ShieldX, AlertTriangle, Flame } from "lucide-react";

// ─── Category-specific advice ─────────────────────────────────────────────────
const CATEGORY_ADVICE: Record<string, { icon: string; text: string }> = {
  "Phishing":           { icon: "🎣", text: "Do not click any links or enter credentials — this appears to be a credential harvesting attempt." },
  "Financial Lure":     { icon: "💸", text: "Do not wire money, send gift cards, or pay any fees — this matches financial scam patterns." },
  "Brand Spoofing":     { icon: "🏢", text: "Contact the company directly via their official website — do not use any links or phone numbers in this email." },
  "Attachments":        { icon: "📎", text: "Do not open or download any attachments — they may contain malware or ransomware." },
  "Personal Data":      { icon: "🔑", text: "No legitimate company asks for passwords, CVV, SSN, or PIN via email. Do not share any." },
  "Crypto Scam":        { icon: "🪙", text: "Do not send cryptocurrency to anyone — all crypto transactions are irreversible." },
  "Social Engineering": { icon: "🧠", text: "This email uses psychological manipulation tactics — verify any claims independently before acting." },
  "Sender Reputation":  { icon: "📧", text: "This sender address shows signs of being fake or disposable — treat with extreme caution." },
  "Suspicious Links":   { icon: "🔗", text: "Suspicious URLs detected — do not click. If needed, visit the website directly by typing its address." },
  "Urgency Language":   { icon: "⏰", text: "Artificial urgency is a common manipulation tactic — slow down and verify before acting." },
  "Adult/Gambling":     { icon: "🚫", text: "This email contains adult or gambling content — report as spam and delete." },
  "Health Scam":        { icon: "💊", text: "This matches health/miracle cure scam patterns — do not purchase or share personal health information." },
};

// ─── Severity config ──────────────────────────────────────────────────────────
function getSeverity(score: number) {
  if (score >= 80) return {
    level: "critical" as const,
    icon: Flame,
    label: "Critical Threat",
    borderColor: "border-red-500/60",
    bgColor: "bg-red-950/40",
    textColor: "text-red-400",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    dotColor: "bg-red-500",
    pulse: true,
    finalAdvice: "Delete this email immediately and report it to your email provider or IT team.",
  };
  if (score >= 65) return {
    level: "high" as const,
    icon: ShieldX,
    label: "High Risk",
    borderColor: "border-orange-500/50",
    bgColor: "bg-orange-950/30",
    textColor: "text-orange-400",
    badgeColor: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dotColor: "bg-orange-500",
    pulse: false,
    finalAdvice: "Do not interact with this email. Mark as spam and delete.",
  };
  return {
    level: "moderate" as const,
    icon: AlertTriangle,
    label: "Caution Advised",
    borderColor: "border-yellow-500/40",
    bgColor: "bg-yellow-950/20",
    textColor: "text-yellow-400",
    badgeColor: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    dotColor: "bg-yellow-500",
    pulse: false,
    finalAdvice: "Verify the sender through official channels before responding or clicking any links.",
  };
}

interface SafetyAdvisoryProps {
  analysis: SpamAnalysis;
}

export function SafetyAdvisory({ analysis }: SafetyAdvisoryProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!analysis.isSpam) return null;

  const severity = getSeverity(analysis.spam_score);
  const Icon = severity.icon;

  // Build contextual advice from detected categories
  const detectedCategories = analysis.score_breakdown
    .filter((b) => b.score > 8)
    .map((b) => b.category)
    .filter((cat) => cat in CATEGORY_ADVICE);

  return (
    <div
      className={`rounded-lg border ${severity.borderColor} ${severity.bgColor} overflow-hidden`}
      style={{
        animation: "advisorySlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      <style>{`
        @keyframes advisorySlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes advisoryItemIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header row */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        {/* Pulsing dot for critical */}
        {severity.pulse && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${severity.dotColor} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${severity.dotColor}`} />
          </span>
        )}
        {!severity.pulse && (
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${severity.dotColor}`} />
        )}

        <Icon className={`h-4 w-4 shrink-0 ${severity.textColor}`} />

        <span className={`font-mono text-xs font-bold uppercase tracking-widest flex-1 text-left ${severity.textColor}`}>
          {severity.label}
        </span>

        <span className={`font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded border ${severity.badgeColor}`}>
          {analysis.spam_score}/100
        </span>

        {collapsed
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2.5">
          {/* Category-specific tips */}
          {detectedCategories.length > 0 && (
            <ul className="space-y-2">
              {detectedCategories.map((cat, i) => {
                const advice = CATEGORY_ADVICE[cat]!;
                return (
                  <li
                    key={cat}
                    className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed"
                    style={{
                      animation: "advisoryItemIn 0.25s ease forwards",
                      animationDelay: `${i * 0.06}s`,
                      opacity: 0,
                    }}
                  >
                    <span className="text-base leading-none mt-0.5">{advice.icon}</span>
                    <span>
                      <span className={`font-semibold ${severity.textColor}`}>{cat}:</span>{" "}
                      {advice.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Final generic advice */}
          <div className={`mt-3 pt-3 border-t ${severity.borderColor} flex items-start gap-2`}>
            <span className="text-base leading-none mt-0.5">👉</span>
            <p className={`text-xs font-semibold ${severity.textColor}`}>
              {severity.finalAdvice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
