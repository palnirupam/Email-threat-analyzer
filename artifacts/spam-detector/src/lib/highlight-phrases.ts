// Frontend phrase library for keyword highlighting after analysis.
// Kept deliberately smaller than the backend list for performance.

export type HighlightCategory =
  | "phishing"
  | "financial"
  | "urgency"
  | "crypto"
  | "social"
  | "personal"
  | "marketing"
  | "health"
  | "corporate";

export interface PhraseEntry {
  phrase: string;
  category: HighlightCategory;
}

// Color mapping per category (Tailwind-compatible inline styles)
export const CATEGORY_COLORS: Record<HighlightCategory, { bg: string; text: string; label: string }> = {
  phishing:  { bg: "rgba(239,68,68,0.25)",   text: "#fca5a5", label: "Phishing" },
  financial: { bg: "rgba(249,115,22,0.25)",  text: "#fdba74", label: "Financial Lure" },
  urgency:   { bg: "rgba(234,179,8,0.25)",   text: "#fde047", label: "Urgency" },
  crypto:    { bg: "rgba(168,85,247,0.25)",  text: "#d8b4fe", label: "Crypto Scam" },
  social:    { bg: "rgba(99,102,241,0.25)",  text: "#a5b4fc", label: "Social Engineering" },
  personal:  { bg: "rgba(236,72,153,0.25)",  text: "#f9a8d4", label: "Personal Data" },
  marketing: { bg: "rgba(234,179,8,0.18)",   text: "#fde68a", label: "Marketing Spam" },
  health:    { bg: "rgba(34,197,94,0.22)",   text: "#86efac", label: "Health Scam" },
  corporate: { bg: "rgba(56,189,248,0.25)",  text: "#7dd3fc", label: "Corporate IT Lure" },
};

// Phrases sorted longest-first to avoid partial overlaps during matching
const _HIGHLIGHT_PHRASES: PhraseEntry[] = [
  // Phishing
  { phrase: "verify your account", category: "phishing" },
  { phrase: "confirm your account", category: "phishing" },
  { phrase: "confirm your identity", category: "phishing" },
  { phrase: "verify your identity", category: "phishing" },
  { phrase: "account will be closed", category: "phishing" },
  { phrase: "account will be terminated", category: "phishing" },
  { phrase: "account has been suspended", category: "phishing" },
  { phrase: "unauthorized access", category: "phishing" },
  { phrase: "unauthorized login", category: "phishing" },
  { phrase: "unusual activity", category: "phishing" },
  { phrase: "suspicious activity", category: "phishing" },
  { phrase: "your password has expired", category: "phishing" },
  { phrase: "failure to verify", category: "phishing" },
  { phrase: "failure to confirm", category: "phishing" },
  { phrase: "re-authenticate", category: "phishing" },
  { phrase: "account locked", category: "phishing" },
  { phrase: "account suspended", category: "phishing" },
  { phrase: "click the link below", category: "phishing" },
  { phrase: "click this link", category: "phishing" },
  { phrase: "update your payment", category: "phishing" },
  { phrase: "security alert", category: "phishing" },
  { phrase: "login attempt", category: "phishing" },

  // Financial
  { phrase: "you have won", category: "financial" },
  { phrase: "you are a winner", category: "financial" },
  { phrase: "claim your prize", category: "financial" },
  { phrase: "claim your reward", category: "financial" },
  { phrase: "lottery winner", category: "financial" },
  { phrase: "cash prize", category: "financial" },
  { phrase: "free money", category: "financial" },
  { phrase: "unclaimed funds", category: "financial" },
  { phrase: "unclaimed money", category: "financial" },
  { phrase: "million dollars", category: "financial" },
  { phrase: "wire transfer", category: "financial" },
  { phrase: "western union", category: "financial" },
  { phrase: "make money fast", category: "financial" },
  { phrase: "double your money", category: "financial" },
  { phrase: "get rich", category: "financial" },
  { phrase: "prize money", category: "financial" },
  { phrase: "nigerian prince", category: "financial" },
  { phrase: "earn extra cash", category: "financial" },

  // Urgency
  { phrase: "immediate action required", category: "urgency" },
  { phrase: "urgent response required", category: "urgency" },
  { phrase: "within 24 hours", category: "urgency" },
  { phrase: "within 48 hours", category: "urgency" },
  { phrase: "time is running out", category: "urgency" },
  { phrase: "final warning", category: "urgency" },
  { phrase: "final notice", category: "urgency" },
  { phrase: "today only", category: "urgency" },
  { phrase: "last chance", category: "urgency" },
  { phrase: "act now", category: "urgency" },
  { phrase: "don't delay", category: "urgency" },
  { phrase: "right now", category: "urgency" },
  { phrase: "expires soon", category: "urgency" },
  { phrase: "don't miss out", category: "urgency" },
  { phrase: "immediately", category: "urgency" },

  // Crypto
  { phrase: "send bitcoin", category: "crypto" },
  { phrase: "send crypto", category: "crypto" },
  { phrase: "crypto wallet", category: "crypto" },
  { phrase: "seed phrase", category: "crypto" },
  { phrase: "private key", category: "crypto" },
  { phrase: "guaranteed returns", category: "crypto" },
  { phrase: "1000x returns", category: "crypto" },
  { phrase: "100x profit", category: "crypto" },
  { phrase: "blockchain investment", category: "crypto" },
  { phrase: "recover your wallet", category: "crypto" },
  { phrase: "crypto airdrop", category: "crypto" },

  // Social Engineering
  { phrase: "strictly confidential", category: "social" },
  { phrase: "this is not a scam", category: "social" },
  { phrase: "keep this between us", category: "social" },
  { phrase: "i selected you", category: "social" },
  { phrase: "chosen you specifically", category: "social" },
  { phrase: "next of kin", category: "social" },
  { phrase: "my late husband", category: "social" },
  { phrase: "my late wife", category: "social" },
  { phrase: "transfer of funds", category: "social" },
  { phrase: "mutual benefit", category: "social" },
  { phrase: "foreign beneficiary", category: "social" },
  { phrase: "your assistance is needed", category: "social" },

  // Personal Data
  { phrase: "credit card number", category: "personal" },
  { phrase: "social security", category: "personal" },
  { phrase: "bank account details", category: "personal" },
  { phrase: "routing number", category: "personal" },
  { phrase: "your password", category: "personal" },
  { phrase: "your pin", category: "personal" },
  { phrase: "expiry date", category: "personal" },

  // Marketing Spam
  { phrase: "limited time offer", category: "marketing" },
  { phrase: "one time offer", category: "marketing" },
  { phrase: "100% free", category: "marketing" },
  { phrase: "absolutely free", category: "marketing" },
  { phrase: "no obligation", category: "marketing" },
  { phrase: "money back guarantee", category: "marketing" },
  { phrase: "risk free", category: "marketing" },
  { phrase: "pre-approved", category: "marketing" },
  { phrase: "you've been selected", category: "marketing" },

  // Health Scam
  { phrase: "miracle cure", category: "health" },
  { phrase: "doctors hate", category: "health" },
  { phrase: "lose weight fast", category: "health" },
  { phrase: "clinically proven", category: "health" },
  { phrase: "secret formula", category: "health" },
  { phrase: "big pharma doesn't want", category: "health" },
  { phrase: "work from home", category: "health" },
  { phrase: "financial freedom", category: "health" },

  // Corporate IT Lure
  { phrase: "indexing operation", category: "corporate" },
  { phrase: "archived internal resources", category: "corporate" },
  { phrase: "retrieval latency", category: "corporate" },
  { phrase: "synchronized content", category: "corporate" },
  { phrase: "system reference portal", category: "corporate" },
  { phrase: "automated retrieval request", category: "corporate" },
  { phrase: "external endpoint", category: "corporate" },
  { phrase: "profile token", category: "corporate" },
  { phrase: "security token", category: "corporate" },
  { phrase: "digital records service", category: "corporate" },
  { phrase: "automated resource operations", category: "corporate" },

  // Advanced / Verbose IT Lures
  { phrase: "reconciliation process", category: "corporate" },
  { phrase: "reconciliation event", category: "corporate" },
  { phrase: "distributed collaboration", category: "corporate" },
  { phrase: "workspace environments", category: "corporate" },
  { phrase: "workspace environment", category: "corporate" },
  { phrase: "continuity assurance", category: "corporate" },
  { phrase: "synchronized metadata", category: "corporate" },
  { phrase: "configuration metadata", category: "corporate" },
  { phrase: "integrity validation", category: "corporate" },
  { phrase: "service coordination portal", category: "corporate" },
  { phrase: "synchronization interval", category: "corporate" },
  { phrase: "infrastructure coordination", category: "corporate" },
  { phrase: "profile session", category: "corporate" },
];

export const HIGHLIGHT_PHRASES = _HIGHLIGHT_PHRASES.sort((a, b) => b.phrase.length - a.phrase.length); // longest first to avoid partial matches
