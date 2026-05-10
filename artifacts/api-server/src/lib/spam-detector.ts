interface EmailData {
  email_body: string;
  subject: string;
  sender_email: string;
  attachments?: string | null;
}

// ─── Weighted phrase categories ──────────────────────────────────────────────
// Each entry: [phrase, weight 0..1]  weight contributes directly to spam_score

const FINANCIAL_LURE: [string, number][] = [
  ["you have won", 0.18], ["you are selected", 0.14], ["you are a winner", 0.18],
  ["congratulations", 0.08], ["claim your prize", 0.20], ["claim your reward", 0.18],
  ["claim now", 0.14], ["collect your", 0.12], ["lottery winner", 0.22],
  ["lottery ticket", 0.14], ["jackpot", 0.12], ["prize money", 0.16],
  ["nigerian prince", 0.30], ["inheritance", 0.12], ["unclaimed funds", 0.20],
  ["unclaimed money", 0.20], ["estate funds", 0.14], ["million dollars", 0.16],
  ["million usd", 0.16], ["billion dollars", 0.14], ["wire transfer", 0.18],
  ["western union", 0.18], ["moneygram", 0.16], ["cash prize", 0.18],
  ["free money", 0.18], ["earn extra cash", 0.16], ["get rich", 0.14],
  ["make money fast", 0.18], ["double your money", 0.18], ["investment opportunity", 0.10],
  ["business proposal", 0.10], ["profit share", 0.12],
];

const PHISHING: [string, number][] = [
  ["verify your account", 0.22], ["verify account", 0.20], ["confirm your account", 0.22],
  ["confirm your identity", 0.20], ["verify your identity", 0.20],
  ["confirm your details", 0.18], ["update your information", 0.16],
  ["update payment", 0.18], ["update your payment", 0.20],
  ["confirm password", 0.24], ["reset your password", 0.12],
  ["your password has expired", 0.24], ["your account has been", 0.18],
  ["account locked", 0.20], ["account suspended", 0.20], ["account compromised", 0.22],
  ["account will be closed", 0.24], ["account will be terminated", 0.24],
  ["unusual activity", 0.18], ["suspicious activity", 0.16],
  ["unauthorized access", 0.20], ["unauthorized login", 0.20],
  ["unusual sign-in", 0.18], ["click this link", 0.16],
  ["click the link below", 0.14], ["download attachment", 0.14],
  ["re-authenticate", 0.22], ["re-verify", 0.20], ["re-confirm", 0.16],
  ["urgent response required", 0.18], ["immediate action required", 0.20],
  ["failure to verify", 0.22], ["failure to confirm", 0.22],
  ["bank account details", 0.22], ["social security", 0.22],
  ["your ssn", 0.26], ["tax refund", 0.16], ["irs notice", 0.16],
  ["government grant", 0.14], ["federal grant", 0.14],
];

const MARKETING_SPAM: [string, number][] = [
  ["click here", 0.10], ["click below", 0.10], ["act now", 0.12],
  ["limited time", 0.10], ["limited time offer", 0.12], ["limited offer", 0.12],
  ["exclusive offer", 0.10], ["special offer", 0.08], ["one time offer", 0.14],
  ["time sensitive", 0.12], ["expires soon", 0.10], ["don't miss out", 0.10],
  ["last chance", 0.10], ["final notice", 0.14], ["risk free", 0.12],
  ["no obligation", 0.10], ["money back guarantee", 0.10], ["satisfaction guaranteed", 0.06],
  ["100% free", 0.14], ["absolutely free", 0.12], ["completely free", 0.10],
  ["unsubscribe", 0.06], ["opt out", 0.06], ["remove me", 0.06],
  ["buy now", 0.08], ["order now", 0.08], ["shop now", 0.06],
  ["call now", 0.10], ["call today", 0.08], ["reply now", 0.10],
  ["respond now", 0.10], ["act immediately", 0.14],
];

const ADULT_GAMBLING: [string, number][] = [
  ["casino", 0.14], ["online casino", 0.18], ["slot machine", 0.16],
  ["poker", 0.08], ["blackjack", 0.10], ["sports betting", 0.12],
  ["place your bet", 0.14], ["free spins", 0.16], ["bonus chips", 0.12],
  ["viagra", 0.30], ["cialis", 0.30], ["levitra", 0.30],
  ["erectile", 0.22], ["enlargement", 0.20], ["male enhancement", 0.24],
  ["adult dating", 0.24], ["meet singles", 0.14], ["hot singles", 0.18],
  ["hookup", 0.18], ["dating site", 0.08],
];

const HEALTH_SCAM: [string, number][] = [
  ["weight loss", 0.12], ["lose weight fast", 0.16], ["burn fat", 0.12],
  ["miracle cure", 0.20], ["clinically proven", 0.10], ["doctors hate", 0.20],
  ["secret formula", 0.16], ["natural remedy", 0.08], ["herbal supplement", 0.08],
  ["detox", 0.06], ["anti-aging", 0.06], ["wrinkle free", 0.10],
  ["work from home", 0.12], ["earn money online", 0.14], ["passive income", 0.10],
  ["financial freedom", 0.10], ["be your own boss", 0.12],
];

const CRYPTO_SCAM: [string, number][] = [
  ["bitcoin", 0.10], ["ethereum", 0.08], ["crypto", 0.08],
  ["cryptocurrency", 0.08], ["blockchain investment", 0.14],
  ["crypto wallet", 0.12], ["send bitcoin", 0.22], ["send crypto", 0.20],
  ["nft mint", 0.14], ["token sale", 0.12], ["ico investment", 0.14],
  ["rugpull", 0.24], ["pump and dump", 0.24], ["guaranteed returns", 0.18],
  ["1000x returns", 0.22], ["100x profit", 0.20],
];

// Legitimate signals — reduce spam score
const LEGITIMATE_SIGNALS: [string, number][] = [
  ["please let me know", 0.08], ["best regards", 0.07], ["kind regards", 0.07],
  ["warm regards", 0.07], ["sincerely", 0.06], ["looking forward", 0.06],
  ["let me know if", 0.07], ["feel free to", 0.05], ["as discussed", 0.08],
  ["as per our", 0.08], ["following up", 0.06], ["per your request", 0.08],
  ["thanks for", 0.05], ["thank you for", 0.05], ["attached please find", 0.08],
  ["please find attached", 0.08], ["invoice attached", 0.06],
  ["meeting agenda", 0.08], ["project update", 0.07], ["status update", 0.06],
  ["quarterly report", 0.08], ["annual report", 0.08], ["team meeting", 0.08],
  ["pull request", 0.10], ["code review", 0.10], ["deployment", 0.07],
  ["unsubscribe link", 0.04], ["privacy policy", 0.04], ["terms of service", 0.04],
];

// Known brand names used for spoofing
const BRAND_NAMES = [
  "paypal", "amazon", "apple", "google", "microsoft", "netflix", "facebook",
  "instagram", "twitter", "linkedin", "whatsapp", "ebay", "walmart", "fedex",
  "ups", "dhl", "irs", "bank of america", "chase", "wells fargo", "citibank",
  "hsbc", "barclays", "halifax", "lloyds", "natwest",
];

// Suspicious free/disposable domains
const SUSPICIOUS_DOMAINS = [
  "tempmail", "guerrillamail", "mailinator", "throwaway", "disposable",
  "fakeinbox", "trashmail", "yopmail", "getairmail", "sharklasers",
  "guerrillamailblock", "grr.la", "spam4.me", "binkmail", "dispostable",
  "mailnull", "maildrop", "tempr.email", "throwam", "tempm",
];

// Suspicious TLDs (high-abuse registries)
const SUSPICIOUS_TLDS = [".xyz", ".tk", ".ml", ".ga", ".cf", ".top", ".click",
  ".download", ".loan", ".work", ".date", ".faith", ".racing", ".stream", ".gq"];

const SUSPICIOUS_SENDER_PATTERNS = [
  /[0-9]{5,}@/,
  /admin@.*\.(xyz|tk|ml|ga|cf|top)$/i,
  /support@.*\.(xyz|tk|ml|ga|cf|top)$/i,
  /noreply-[a-z0-9]+@(?!.*\.(com|org|net|edu|gov|co\.[a-z]{2})$)/i,
  /[a-z]{2,6}[0-9]{4,}@/,
  /no[-_]?reply@[a-z0-9-]+\.[a-z]{2,3}[^.]/i,
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function normalizeObfuscation(text: string): string {
  return text
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/8/g, "b")
    .replace(/@/g, "a").replace(/\$/g, "s").replace(/!/g, "i")
    .replace(/\+/g, "t").replace(/\|/g, "l").replace(/\*/g, "a")
    .replace(/\[i\]/gi, "i").replace(/\[a\]/gi, "a").replace(/\[e\]/gi, "e");
}

function scorePhrases(
  text: string,
  normalizedText: string,
  categories: [string, number][][],
): { matches: string[]; score: number } {
  const matches: string[] = [];
  let score = 0;
  const seen = new Set<string>();

  for (const category of categories) {
    for (const [phrase, weight] of category) {
      if (seen.has(phrase)) continue;
      if (text.includes(phrase) || normalizedText.includes(phrase)) {
        seen.add(phrase);
        matches.push(phrase);
        score += weight;
      }
    }
  }
  return { matches, score };
}

function scoreLegitimate(text: string): number {
  let score = 0;
  for (const [phrase, weight] of LEGITIMATE_SIGNALS) {
    if (text.includes(phrase)) score += weight;
  }
  return Math.min(score, 0.5);
}

function detectAllCapsRatio(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const capsWords = words.filter((w) => {
    const alpha = w.replace(/[^a-zA-Z]/g, "");
    return alpha.length > 2 && alpha === alpha.toUpperCase();
  });
  return capsWords.length / words.length;
}

function detectExcessivePunctuation(text: string): { score: number; detail: string | null } {
  const exclamations = (text.match(/!{2,}/g) || []).length;
  const questions = (text.match(/\?{2,}/g) || []).length;
  const totalPunct = exclamations + questions;
  if (totalPunct === 0) return { score: 0, detail: null };
  const score = Math.min(totalPunct * 0.06, 0.20);
  return { score, detail: `Excessive punctuation: ${exclamations} "!!" cluster(s), ${questions} "??" cluster(s)` };
}

function detectMoneyPatterns(text: string): { score: number; count: number } {
  const patterns = [
    /\$\s?[\d,]+(?:\.\d{2})?/g,
    /£\s?[\d,]+(?:\.\d{2})?/g,
    /€\s?[\d,]+(?:\.\d{2})?/g,
    /[\d,]+\s?(USD|GBP|EUR|usd|gbp|eur)/g,
    /[\d]+ million/gi,
    /[\d]+ billion/gi,
  ];
  let count = 0;
  for (const p of patterns) count += (text.match(p) || []).length;
  return { score: Math.min(count * 0.07, 0.25), count };
}

function detectBrandSpoofing(
  text: string,
  senderEmail: string,
  subject: string,
): { detected: boolean; brands: string[] } {
  const lowerSender = senderEmail.toLowerCase();
  const lowerText = text.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const detected: string[] = [];

  for (const brand of BRAND_NAMES) {
    const mentionedInContent = lowerText.includes(brand) || lowerSubject.includes(brand);
    if (!mentionedInContent) continue;

    const domainMatch = lowerSender.match(/@([^@]+)$/);
    const domain = domainMatch ? domainMatch[1] : "";

    // Flag if brand is mentioned in body/subject but sender domain doesn't contain the brand
    const brandWord = brand.split(" ")[0]; // e.g. "bank" from "bank of america"
    if (!domain.includes(brandWord) && mentionedInContent) {
      // Extra check: don't flag if the domain is a well-known legitimate provider like gmail/outlook
      const legitimateProviders = ["gmail", "outlook", "yahoo", "hotmail", "icloud", "proton"];
      const isGenericProvider = legitimateProviders.some((p) => domain.includes(p));
      if (!isGenericProvider) {
        detected.push(brand);
      }
    }
  }
  const uniqueBrands = [...new Set(detected)];
  return { detected: uniqueBrands.length > 0, brands: uniqueBrands };
}

function analyzeUrls(text: string): {
  count: number; suspicious_count: number; suspiciousUrls: string[];
} {
  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  const urls = text.match(urlPattern) || [];

  const suspiciousPatterns = [
    /bit\.ly|tinyurl|goo\.gl|ow\.ly|t\.co|short\.io|shorturl|tiny\.cc|is\.gd/i,
    /\.(xyz|tk|ml|ga|cf|top|click|download|loan|work|date|faith|racing|stream|gq)($|\/)/i,
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\.(com|net|org)/i,
    /paypa[1l]|arnazon|g00gle|micros0ft|app[1l]e/i,
    /@.*\//,                           // URL with @ (credential stuffing)
    /[^\w]login[^\w].*\.(xyz|tk|ml)/i,
  ];

  const suspiciousUrls: string[] = [];
  for (const url of urls) {
    if (suspiciousPatterns.some((p) => p.test(url))) {
      suspiciousUrls.push(url);
    }
  }
  return { count: urls.length, suspicious_count: suspiciousUrls.length, suspiciousUrls };
}

function analyzeAttachments(attachments: string): {
  detected_attachments: string[]; risk_score: number; has_suspicious: boolean;
} {
  const parts = attachments.split(",").map((s) => s.trim()).filter(Boolean);
  const dangerous = [".exe", ".bat", ".scr", ".cmd", ".vbs", ".js", ".jar", ".msi",
    ".ps1", ".reg", ".hta", ".wsf", ".com", ".pif"];
  const risky = [".pdf", ".docm", ".xlsm", ".pptm", ".zip", ".rar", ".7z", ".iso",
    ".img", ".docx", ".xlsx", ".doc", ".xls"];
  const doubleExtPattern = /\.[a-z]{2,4}\.[a-z]{2,4}$/i;
  const hiddenPattern = /^\..*|^~\$/;

  const detected: string[] = [];
  let risk_score = 0;
  let has_suspicious = false;

  for (const file of parts) {
    const lower = file.toLowerCase();
    if (dangerous.some((ext) => lower.endsWith(ext))) {
      detected.push(`${file} (dangerous executable)`);
      risk_score += 0.28;
      has_suspicious = true;
    } else if (doubleExtPattern.test(lower)) {
      detected.push(`${file} (double extension — suspicious)`);
      risk_score += 0.22;
      has_suspicious = true;
    } else if (hiddenPattern.test(file)) {
      detected.push(`${file} (hidden/temp file)`);
      risk_score += 0.18;
      has_suspicious = true;
    } else if (risky.some((ext) => lower.endsWith(ext))) {
      detected.push(`${file} (potentially risky format)`);
      risk_score += 0.06;
    }
  }

  return { detected_attachments: detected, risk_score: Math.min(risk_score, 0.55), has_suspicious };
}

function checkSenderReputation(sender: string): {
  is_suspicious: boolean; reasons: string[];
} {
  if (!sender) return { is_suspicious: false, reasons: [] };
  const lower = sender.toLowerCase();
  const domainMatch = lower.match(/@([^@]+)$/);
  const domain = domainMatch ? domainMatch[1] : "";
  const reasons: string[] = [];

  if (SUSPICIOUS_DOMAINS.some((d) => domain.includes(d))) {
    reasons.push("Disposable/temporary email service");
  }
  if (SUSPICIOUS_TLDS.some((t) => domain.endsWith(t))) {
    reasons.push(`High-abuse TLD: .${domain.split(".").pop()}`);
  }
  if (SUSPICIOUS_SENDER_PATTERNS.some((p) => p.test(sender))) {
    reasons.push("Suspicious sender name/pattern");
  }
  // Excessive subdomains (e.g., verify.secure.paypal.scam.com)
  if ((domain.match(/\./g) || []).length > 3) {
    reasons.push("Excessive subdomains in sender domain");
  }
  // Brand in domain that's clearly not the brand
  for (const brand of ["paypal", "amazon", "apple", "google", "microsoft", "netflix"]) {
    if (domain.includes(brand) && !domain.endsWith(`${brand}.com`) && !domain.endsWith(`${brand}.co.uk`)) {
      reasons.push(`Domain impersonates ${brand}`);
    }
  }

  return { is_suspicious: reasons.length > 0, reasons };
}

function analyzeSubject(subject: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;

  const capsRatio = detectAllCapsRatio(subject);
  if (capsRatio > 0.5) {
    score += 0.14;
    issues.push(`Subject is ${Math.round(capsRatio * 100)}% ALL CAPS`);
  }

  const punct = detectExcessivePunctuation(subject);
  if (punct.score > 0) {
    score += punct.score;
    if (punct.detail) issues.push(`Subject: ${punct.detail}`);
  }

  const urgencyPrefixes = ["urgent:", "action required:", "final notice:", "warning:", "alert:", "important:"];
  if (urgencyPrefixes.some((p) => subject.toLowerCase().startsWith(p))) {
    score += 0.12;
    issues.push("Subject uses high-pressure urgency prefix");
  }

  const moneyInSubject = detectMoneyPatterns(subject);
  if (moneyInSubject.count > 0) {
    score += 0.10;
    issues.push(`Subject contains ${moneyInSubject.count} money/currency reference(s)`);
  }

  const fwdRe = subject.toLowerCase();
  if ((fwdRe.startsWith("re:") || fwdRe.startsWith("fwd:")) && subject.length < 10) {
    score += 0.08;
    issues.push("Suspicious minimal Re:/Fwd: subject");
  }

  return { score, issues };
}

// Sigmoid for smooth confidence — maps score near 0.5 to uncertain, extremes to confident
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export function analyzeSpam(email: EmailData) {
  const fullText = `${email.subject} ${email.email_body}`.toLowerCase();
  const normalizedFull = normalizeObfuscation(fullText);

  let spam_score = 0;
  const risk_factors: string[] = [];
  const suspicious_keywords: string[] = [];
  const email_structure_issues: string[] = [];
  const detected_attachments: string[] = [];
  let sender_reputation_warning: string | undefined;

  // Per-category raw scores (before clamping)
  const cat: Record<string, number> = {
    "Financial Lure": 0, "Phishing": 0, "Marketing Spam": 0,
    "Adult/Gambling": 0, "Health Scam": 0, "Crypto Scam": 0,
    "Personal Data": 0, "Urgency Language": 0, "Suspicious Links": 0,
    "Brand Spoofing": 0, "Sender Reputation": 0, "Content Structure": 0,
    "Attachments": 0,
  };

  // ── 1. Weighted phrase scoring per category ───────────────────────────────
  const categoryDefs: [string, [string, number][]][] = [
    ["Financial Lure", FINANCIAL_LURE],
    ["Phishing", PHISHING],
    ["Marketing Spam", MARKETING_SPAM],
    ["Adult/Gambling", ADULT_GAMBLING],
    ["Health Scam", HEALTH_SCAM],
    ["Crypto Scam", CRYPTO_SCAM],
  ];

  let totalPhraseMatches = 0;
  for (const [catName, phrases] of categoryDefs) {
    const { matches, score } = scorePhrases(fullText, normalizedFull, [phrases]);
    if (matches.length > 0) {
      cat[catName] += score;
      spam_score += score;
      suspicious_keywords.push(...matches.slice(0, 3));
      totalPhraseMatches += matches.length;
    }
  }
  if (totalPhraseMatches > 0) {
    risk_factors.push(`${totalPhraseMatches} suspicious phrase(s) detected`);
  }

  // ── 2. Legitimate signals (negative weight) ───────────────────────────────
  const legitScore = scoreLegitimate(fullText);
  if (legitScore > 0) {
    spam_score = Math.max(0, spam_score - legitScore);
  }

  // ── 3. Subject-specific analysis ─────────────────────────────────────────
  const subjectAnalysis = analyzeSubject(email.subject);
  cat["Content Structure"] += subjectAnalysis.score;
  spam_score += subjectAnalysis.score;
  email_structure_issues.push(...subjectAnalysis.issues);

  // ── 4. Body all-caps ratio ────────────────────────────────────────────────
  const capsRatio = detectAllCapsRatio(email.email_body);
  if (capsRatio > 0.15) {
    const s = Math.min(capsRatio * 0.25, 0.20);
    cat["Content Structure"] += s;
    spam_score += s;
    email_structure_issues.push(`Body: ${Math.round(capsRatio * 100)}% of words in ALL CAPS`);
  }

  // ── 5. Excessive punctuation in body ─────────────────────────────────────
  const bodyPunct = detectExcessivePunctuation(email.email_body);
  if (bodyPunct.score > 0) {
    cat["Content Structure"] += bodyPunct.score;
    spam_score += bodyPunct.score;
    if (bodyPunct.detail) email_structure_issues.push(bodyPunct.detail);
  }

  // ── 6. Money/currency patterns ────────────────────────────────────────────
  const moneyAnalysis = detectMoneyPatterns(fullText);
  if (moneyAnalysis.count > 1) {
    cat["Financial Lure"] += moneyAnalysis.score;
    spam_score += moneyAnalysis.score;
    risk_factors.push(`${moneyAnalysis.count} money/currency reference(s) in email`);
  }

  // ── 7. URL analysis ───────────────────────────────────────────────────────
  const urlAnalysis = analyzeUrls(email.email_body);
  if (urlAnalysis.suspicious_count > 0) {
    const s = urlAnalysis.suspicious_count * 0.18;
    cat["Suspicious Links"] += s;
    spam_score += s;
    risk_factors.push(`${urlAnalysis.suspicious_count} suspicious/obfuscated link(s) detected`);
  }
  if (urlAnalysis.count > 5) {
    const s = Math.min((urlAnalysis.count - 5) * 0.05, 0.20);
    cat["Suspicious Links"] += s;
    spam_score += s;
    email_structure_issues.push(`Unusually high number of links (${urlAnalysis.count})`);
  }

  // ── 8. Brand spoofing detection ───────────────────────────────────────────
  const spoofCheck = detectBrandSpoofing(email.email_body, email.sender_email, email.subject);
  if (spoofCheck.detected && spoofCheck.brands.length > 0) {
    const s = Math.min(spoofCheck.brands.length * 0.18, 0.36);
    cat["Brand Spoofing"] += s;
    spam_score += s;
    risk_factors.push(`Possible brand spoofing: impersonates ${spoofCheck.brands.slice(0, 3).join(", ")}`);
  }

  // ── 9. Sender reputation ──────────────────────────────────────────────────
  const senderCheck = checkSenderReputation(email.sender_email);
  if (senderCheck.is_suspicious) {
    const s = Math.min(senderCheck.reasons.length * 0.12, 0.30);
    cat["Sender Reputation"] += s;
    spam_score += s;
    sender_reputation_warning = senderCheck.reasons.join("; ");
    risk_factors.push(`Sender reputation issues: ${senderCheck.reasons[0]}`);
  }

  // ── 10. HTML/obfuscated content ───────────────────────────────────────────
  const htmlTags = (email.email_body.match(/<[a-z][\s\S]*?>/gi) || []).length;
  if (htmlTags > 0) {
    const s = Math.min(htmlTags * 0.08, 0.25);
    cat["Content Structure"] += s;
    spam_score += s;
    email_structure_issues.push(`Contains ${htmlTags} HTML element(s)`);
  }

  // ── 11. Obfuscation detection (leet-speak) ────────────────────────────────
  const obfuscatedPhrases = ["v1agra", "c1alis", "fr33", "fr@e", "s3x", "p0rn", "c4sh", "w1n", "pr1ze"];
  const obfHits = obfuscatedPhrases.filter((p) => email.email_body.toLowerCase().includes(p));
  if (obfHits.length > 0) {
    const s = obfHits.length * 0.15;
    cat["Content Structure"] += s;
    spam_score += s;
    risk_factors.push(`Obfuscated spam terms detected (${obfHits.length}): ${obfHits.join(", ")}`);
  }

  // ── 12. Personal data requests ────────────────────────────────────────────
  const personalDataPhrases: [string, number][] = [
    ["your password", 0.18], ["credit card number", 0.24], ["card number", 0.16],
    ["bank account", 0.18], ["bank details", 0.18], ["social security", 0.22],
    ["confirm identity", 0.16], ["your pin", 0.22], ["cvv", 0.20], ["expiry date", 0.14],
    ["routing number", 0.20], ["account number", 0.14],
  ];
  const { matches: dataMatches, score: dataScore } = scorePhrases(fullText, normalizedFull, [personalDataPhrases]);
  if (dataMatches.length > 0) {
    cat["Personal Data"] += dataScore;
    spam_score += dataScore;
    risk_factors.push(`Requests sensitive personal data (${dataMatches.length} indicator(s))`);
  }

  // ── 13. Urgency amplifiers ────────────────────────────────────────────────
  const urgencyWords = [
    "urgent", "immediately", "asap", "hurry", "expire", "expiring",
    "act now", "right now", "today only", "within 24 hours", "within 48 hours",
    "don't delay", "last chance", "final warning", "final notice",
  ];
  const urgencyHits = urgencyWords.filter((w) => fullText.includes(w));
  if (urgencyHits.length > 2) {
    const s = Math.min(urgencyHits.length * 0.07, 0.25);
    cat["Urgency Language"] += s;
    spam_score += s;
    risk_factors.push(`Excessive urgency language (${urgencyHits.length} indicators)`);
  }

  // ── 14. Very short suspicious email ──────────────────────────────────────
  if (email.email_body.trim().length < 30 && email.email_body.trim().length > 0) {
    cat["Content Structure"] += 0.08;
    spam_score += 0.08;
    email_structure_issues.push("Suspiciously short email body");
  }

  // ── 15. Attachment analysis ───────────────────────────────────────────────
  if (email.attachments) {
    const attachmentAnalysis = analyzeAttachments(email.attachments);
    cat["Attachments"] += attachmentAnalysis.risk_score;
    spam_score += attachmentAnalysis.risk_score;
    if (attachmentAnalysis.has_suspicious) {
      risk_factors.push("Email contains high-risk attachment type(s)");
    }
    detected_attachments.push(...attachmentAnalysis.detected_attachments);
  }

  // ── Normalize & final scoring ────────────────────────────────────────────
  spam_score = Math.min(Math.max(spam_score, 0), 1);

  const isSpam = spam_score > 0.48;

  const distanceFromCenter = Math.abs(spam_score - 0.5);
  const rawConfidence = sigmoid(distanceFromCenter * 10 - 2);
  const confidence = 0.50 + rawConfidence * 0.49;

  // Build breakdown — only include categories with non-zero score, sorted descending
  // Max possible contribution per category (used for proportional bar width)
  const CAT_MAX: Record<string, number> = {
    "Financial Lure": 1.0, "Phishing": 1.0, "Marketing Spam": 0.6,
    "Adult/Gambling": 0.8, "Health Scam": 0.5, "Crypto Scam": 0.5,
    "Personal Data": 0.8, "Urgency Language": 0.25, "Suspicious Links": 0.6,
    "Brand Spoofing": 0.36, "Sender Reputation": 0.30, "Content Structure": 0.6,
    "Attachments": 0.55,
  };
  const score_breakdown = Object.entries(cat)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([category, score]) => ({
      category,
      score: Math.round(Math.min(score, 1) * 100),
      max_score: Math.round((CAT_MAX[category] ?? 1) * 100),
    }));

  return {
    isSpam,
    confidence: Math.min(confidence, 0.99),
    spam_score: Math.round(spam_score * 100),
    risk_factors: [...new Set(risk_factors)],
    score_breakdown,
    details: {
      suspicious_keywords: Array.from(new Set(suspicious_keywords)),
      email_structure_issues: [...new Set(email_structure_issues)],
      sender_reputation_warning: sender_reputation_warning ?? null,
      detected_attachments: detected_attachments.length > 0 ? detected_attachments : undefined,
    },
  };
}
