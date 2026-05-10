import {
  FINANCIAL_LURE, PHISHING, MARKETING_SPAM, ADULT_GAMBLING,
  HEALTH_SCAM, CRYPTO_SCAM, LEGITIMATE_SIGNALS, BRAND_NAMES,
  SUSPICIOUS_DOMAINS, SUSPICIOUS_TLDS, SUSPICIOUS_SENDER_PATTERNS,
  PERSONAL_DATA_PHRASES, URGENCY_WORDS, OBFUSCATED_TERMS, CAT_MAX,
} from "./spam-phrases";

interface EmailData {
  email_body: string;
  subject: string;
  sender_email: string;
  attachments?: string | null;
}

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
    const brandWord = brand.split(" ")[0];

    if (!domain.includes(brandWord) && mentionedInContent) {
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
    /@.*\//,
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
  const hiddenPattern = /^\..*/;

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
  if ((domain.match(/\./g) || []).length > 3) {
    reasons.push("Excessive subdomains in sender domain");
  }
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
  const obfHits = OBFUSCATED_TERMS.filter((p) => email.email_body.toLowerCase().includes(p));
  if (obfHits.length > 0) {
    const s = obfHits.length * 0.15;
    cat["Content Structure"] += s;
    spam_score += s;
    risk_factors.push(`Obfuscated spam terms detected (${obfHits.length}): ${obfHits.join(", ")}`);
  }

  // ── 12. Personal data requests ────────────────────────────────────────────
  const { matches: dataMatches, score: dataScore } = scorePhrases(fullText, normalizedFull, [PERSONAL_DATA_PHRASES]);
  if (dataMatches.length > 0) {
    cat["Personal Data"] += dataScore;
    spam_score += dataScore;
    risk_factors.push(`Requests sensitive personal data (${dataMatches.length} indicator(s))`);
  }

  // ── 13. Urgency amplifiers ────────────────────────────────────────────────
  const urgencyHits = URGENCY_WORDS.filter((w) => fullText.includes(w));
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
