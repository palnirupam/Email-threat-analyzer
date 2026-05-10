import {
  FINANCIAL_LURE, PHISHING, MARKETING_SPAM, ADULT_GAMBLING,
  HEALTH_SCAM, CRYPTO_SCAM, SOCIAL_ENGINEERING, LEGITIMATE_SIGNALS,
  BRAND_NAMES, SUSPICIOUS_DOMAINS, SUSPICIOUS_TLDS, SUSPICIOUS_SENDER_PATTERNS,
  PERSONAL_DATA_PHRASES, URGENCY_WORDS, OBFUSCATED_TERMS, CAT_MAX,
} from "./spam-phrases";

interface EmailData {
  email_body: string;
  subject: string;
  sender_email: string;
  attachments?: string | null;
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Bayesian (Noisy-OR) combination of independent probability scores.
 * P(spam) = 1 - ∏(1 - p_i)
 * Unlike simple addition, this gives diminishing returns per additional signal
 * and naturally stays bounded in [0, 1].
 */
function bayesianCombine(scores: number[]): number {
  const nonSpam = scores.reduce((acc, s) => acc * (1 - Math.min(Math.max(s, 0), 0.99)), 1);
  return 1 - nonSpam;
}

/**
 * Shannon entropy of a string — measures randomness.
 * High entropy (>3.5) in a sender's local-part suggests auto-generated addresses.
 */
function shannonEntropy(str: string): number {
  if (!str) return 0;
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] ?? 0) + 1;
  return Object.values(freq).reduce((h, count) => {
    const p = count / str.length;
    return h - p * Math.log2(p);
  }, 0);
}

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

/**
 * Phrase density: (matched phrases / total words).
 * A short email crammed with spam phrases is more suspicious than
 * a long email with the same number of phrases.
 */
function calcPhraseDensity(text: string, matchCount: number): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0 || matchCount === 0) return 0;
  const density = matchCount / wordCount;
  // Score ramps up rapidly after 5% phrase density
  return Math.min(density * 3, 0.30);
}

/**
 * Link density: links per 100 words.
 * Spam emails often have very few words but many links.
 */
function calcLinkDensity(text: string, linkCount: number): number {
  if (linkCount === 0) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;
  const linksPerHundredWords = (linkCount / wordCount) * 100;
  // Flag if >3 links per 100 words
  if (linksPerHundredWords <= 3) return 0;
  return Math.min((linksPerHundredWords - 3) * 0.03, 0.20);
}

/**
 * Co-occurrence boost: if 3+ independent categories fire,
 * it strongly suggests a multi-tactic attack, warranting a multiplier.
 */
function coOccurrenceBoost(activeCategoryCount: number): number {
  if (activeCategoryCount < 3) return 0;
  // +0.05 per category beyond the second, capped at 0.25
  return Math.min((activeCategoryCount - 2) * 0.05, 0.25);
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
    /\$\s?[\d,]+(?:\.\d{2})?/g, /£\s?[\d,]+(?:\.\d{2})?/g,
    /€\s?[\d,]+(?:\.\d{2})?/g, /[\d,]+\s?(USD|GBP|EUR|usd|gbp|eur)/g,
    /[\d]+ million/gi, /[\d]+ billion/gi,
  ];
  let count = 0;
  for (const p of patterns) count += (text.match(p) || []).length;
  return { score: Math.min(count * 0.07, 0.25), count };
}

function detectBrandSpoofing(text: string, senderEmail: string, subject: string) {
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
    if (!domain.includes(brandWord)) {
      const legitimateProviders = ["gmail", "outlook", "yahoo", "hotmail", "icloud", "proton"];
      if (!legitimateProviders.some((p) => domain.includes(p))) {
        detected.push(brand);
      }
    }
  }
  const uniqueBrands = [...new Set(detected)];
  return { detected: uniqueBrands.length > 0, brands: uniqueBrands };
}

function analyzeUrls(text: string) {
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
  const suspiciousUrls = urls.filter((url) => suspiciousPatterns.some((p) => p.test(url)));
  return { count: urls.length, suspicious_count: suspiciousUrls.length, suspiciousUrls };
}

function analyzeAttachments(attachments: string) {
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
      risk_score += 0.28; has_suspicious = true;
    } else if (doubleExtPattern.test(lower)) {
      detected.push(`${file} (double extension — suspicious)`);
      risk_score += 0.22; has_suspicious = true;
    } else if (hiddenPattern.test(file)) {
      detected.push(`${file} (hidden/temp file)`);
      risk_score += 0.18; has_suspicious = true;
    } else if (risky.some((ext) => lower.endsWith(ext))) {
      detected.push(`${file} (potentially risky format)`);
      risk_score += 0.06;
    }
  }
  return { detected_attachments: detected, risk_score: Math.min(risk_score, 0.55), has_suspicious };
}

function checkSenderReputation(sender: string) {
  if (!sender) return { is_suspicious: false, reasons: [], entropy_score: 0 };
  const lower = sender.toLowerCase();
  const domainMatch = lower.match(/@([^@]+)$/);
  const domain = domainMatch ? domainMatch[1] : "";
  const localPart = lower.split("@")[0] ?? "";
  const reasons: string[] = [];

  if (SUSPICIOUS_DOMAINS.some((d) => domain.includes(d))) reasons.push("Disposable/temporary email service");
  if (SUSPICIOUS_TLDS.some((t) => domain.endsWith(t))) reasons.push(`High-abuse TLD: .${domain.split(".").pop()}`);
  if (SUSPICIOUS_SENDER_PATTERNS.some((p) => p.test(sender))) reasons.push("Suspicious sender name/pattern");
  if ((domain.match(/\./g) || []).length > 3) reasons.push("Excessive subdomains in sender domain");
  for (const brand of ["paypal", "amazon", "apple", "google", "microsoft", "netflix"]) {
    if (domain.includes(brand) && !domain.endsWith(`${brand}.com`) && !domain.endsWith(`${brand}.co.uk`)) {
      reasons.push(`Domain impersonates ${brand}`);
    }
  }

  // High entropy local part → likely auto-generated address
  const entropy = shannonEntropy(localPart);
  const entropy_score = entropy > 3.8 ? Math.min((entropy - 3.8) * 0.12, 0.20) : 0;
  if (entropy_score > 0) reasons.push(`Suspicious sender address pattern (entropy: ${entropy.toFixed(1)})`);

  return { is_suspicious: reasons.length > 0, reasons, entropy_score };
}

function analyzeSubject(subject: string) {
  const issues: string[] = [];
  let score = 0;
  const capsRatio = detectAllCapsRatio(subject);
  if (capsRatio > 0.5) {
    score += 0.14;
    issues.push(`Subject is ${Math.round(capsRatio * 100)}% ALL CAPS`);
  }
  const punct = detectExcessivePunctuation(subject);
  if (punct.score > 0) { score += punct.score; if (punct.detail) issues.push(`Subject: ${punct.detail}`); }
  const urgencyPrefixes = ["urgent:", "action required:", "final notice:", "warning:", "alert:", "important:"];
  if (urgencyPrefixes.some((p) => subject.toLowerCase().startsWith(p))) {
    score += 0.12; issues.push("Subject uses high-pressure urgency prefix");
  }
  const moneyInSubject = detectMoneyPatterns(subject);
  if (moneyInSubject.count > 0) {
    score += 0.10; issues.push(`Subject contains ${moneyInSubject.count} money/currency reference(s)`);
  }
  const fwdRe = subject.toLowerCase();
  if ((fwdRe.startsWith("re:") || fwdRe.startsWith("fwd:")) && subject.length < 10) {
    score += 0.08; issues.push("Suspicious minimal Re:/Fwd: subject");
  }
  return { score, issues };
}

// Sigmoid for smooth confidence mapping
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export function analyzeSpam(email: EmailData) {
  const fullText = `${email.subject} ${email.email_body}`.toLowerCase();
  const normalizedFull = normalizeObfuscation(fullText);

  const risk_factors: string[] = [];
  const suspicious_keywords: string[] = [];
  const email_structure_issues: string[] = [];
  const detected_attachments: string[] = [];
  let sender_reputation_warning: string | undefined;

  // Per-category scores (raw, before combination)
  const cat: Record<string, number> = {
    "Financial Lure": 0, "Phishing": 0, "Marketing Spam": 0,
    "Adult/Gambling": 0, "Health Scam": 0, "Crypto Scam": 0,
    "Social Engineering": 0, "Personal Data": 0, "Urgency Language": 0,
    "Suspicious Links": 0, "Brand Spoofing": 0, "Sender Reputation": 0,
    "Content Structure": 0, "Attachments": 0,
  };

  // ── 1. Weighted phrase scoring (all categories) ───────────────────────────
  const categoryDefs: [string, [string, number][]][] = [
    ["Financial Lure", FINANCIAL_LURE],
    ["Phishing", PHISHING],
    ["Marketing Spam", MARKETING_SPAM],
    ["Adult/Gambling", ADULT_GAMBLING],
    ["Health Scam", HEALTH_SCAM],
    ["Crypto Scam", CRYPTO_SCAM],
    ["Social Engineering", SOCIAL_ENGINEERING],
  ];

  let totalPhraseMatches = 0;
  for (const [catName, phrases] of categoryDefs) {
    const { matches, score } = scorePhrases(fullText, normalizedFull, [phrases]);
    if (matches.length > 0) {
      cat[catName] = Math.min(score, CAT_MAX[catName] ?? 1);
      suspicious_keywords.push(...matches.slice(0, 3));
      totalPhraseMatches += matches.length;
    }
  }
  if (totalPhraseMatches > 0) risk_factors.push(`${totalPhraseMatches} suspicious phrase(s) detected`);

  // ── 2. Personal data requests ─────────────────────────────────────────────
  const { matches: dataMatches, score: dataScore } = scorePhrases(fullText, normalizedFull, [PERSONAL_DATA_PHRASES]);
  if (dataMatches.length > 0) {
    cat["Personal Data"] = Math.min(dataScore, CAT_MAX["Personal Data"]!);
    risk_factors.push(`Requests sensitive personal data (${dataMatches.length} indicator(s))`);
  }

  // ── 3. Subject analysis ───────────────────────────────────────────────────
  const subjectAnalysis = analyzeSubject(email.subject);
  cat["Content Structure"] += subjectAnalysis.score;
  email_structure_issues.push(...subjectAnalysis.issues);

  // ── 4. Body caps + punctuation ────────────────────────────────────────────
  const capsRatio = detectAllCapsRatio(email.email_body);
  if (capsRatio > 0.15) {
    cat["Content Structure"] += Math.min(capsRatio * 0.25, 0.20);
    email_structure_issues.push(`Body: ${Math.round(capsRatio * 100)}% of words in ALL CAPS`);
  }
  const bodyPunct = detectExcessivePunctuation(email.email_body);
  if (bodyPunct.score > 0) {
    cat["Content Structure"] += bodyPunct.score;
    if (bodyPunct.detail) email_structure_issues.push(bodyPunct.detail);
  }

  // ── 5. Money patterns ─────────────────────────────────────────────────────
  const moneyAnalysis = detectMoneyPatterns(fullText);
  if (moneyAnalysis.count > 1) {
    cat["Financial Lure"] = Math.min(cat["Financial Lure"]! + moneyAnalysis.score, CAT_MAX["Financial Lure"]!);
    risk_factors.push(`${moneyAnalysis.count} money/currency reference(s) in email`);
  }

  // ── 6. URL analysis ───────────────────────────────────────────────────────
  const urlAnalysis = analyzeUrls(email.email_body);
  if (urlAnalysis.suspicious_count > 0) {
    cat["Suspicious Links"] += urlAnalysis.suspicious_count * 0.18;
    risk_factors.push(`${urlAnalysis.suspicious_count} suspicious/obfuscated link(s) detected`);
  }
  if (urlAnalysis.count > 5) {
    cat["Suspicious Links"] += Math.min((urlAnalysis.count - 5) * 0.05, 0.20);
    email_structure_issues.push(`Unusually high number of links (${urlAnalysis.count})`);
  }
  cat["Suspicious Links"] = Math.min(cat["Suspicious Links"]!, CAT_MAX["Suspicious Links"]!);

  // ── 7. Brand spoofing ─────────────────────────────────────────────────────
  const spoofCheck = detectBrandSpoofing(email.email_body, email.sender_email, email.subject);
  if (spoofCheck.detected) {
    cat["Brand Spoofing"] = Math.min(spoofCheck.brands.length * 0.18, CAT_MAX["Brand Spoofing"]!);
    risk_factors.push(`Possible brand spoofing: impersonates ${spoofCheck.brands.slice(0, 3).join(", ")}`);
  }

  // ── 8. Sender reputation + entropy ───────────────────────────────────────
  const senderCheck = checkSenderReputation(email.sender_email);
  if (senderCheck.is_suspicious) {
    cat["Sender Reputation"] = Math.min(
      senderCheck.reasons.length * 0.12 + senderCheck.entropy_score,
      CAT_MAX["Sender Reputation"]!,
    );
    sender_reputation_warning = senderCheck.reasons.join("; ");
    risk_factors.push(`Sender reputation issues: ${senderCheck.reasons[0]}`);
  }

  // ── 9. HTML content ───────────────────────────────────────────────────────
  const htmlTags = (email.email_body.match(/<[a-z][\s\S]*?>/gi) || []).length;
  if (htmlTags > 0) {
    cat["Content Structure"] += Math.min(htmlTags * 0.08, 0.25);
    email_structure_issues.push(`Contains ${htmlTags} HTML element(s)`);
  }

  // ── 10. Obfuscation (leet-speak) ──────────────────────────────────────────
  const obfHits = OBFUSCATED_TERMS.filter((p) => email.email_body.toLowerCase().includes(p));
  if (obfHits.length > 0) {
    cat["Content Structure"] += obfHits.length * 0.15;
    risk_factors.push(`Obfuscated spam terms detected (${obfHits.length}): ${obfHits.join(", ")}`);
  }
  cat["Content Structure"] = Math.min(cat["Content Structure"]!, CAT_MAX["Content Structure"]!);

  // ── 11. Urgency amplifiers ────────────────────────────────────────────────
  const urgencyHits = URGENCY_WORDS.filter((w) => fullText.includes(w));
  if (urgencyHits.length > 2) {
    cat["Urgency Language"] = Math.min(urgencyHits.length * 0.07, CAT_MAX["Urgency Language"]!);
    risk_factors.push(`Excessive urgency language (${urgencyHits.length} indicators)`);
  }

  // ── 12. Very short email ──────────────────────────────────────────────────
  if (email.email_body.trim().length < 30 && email.email_body.trim().length > 0) {
    cat["Content Structure"] = Math.min((cat["Content Structure"] ?? 0) + 0.08, CAT_MAX["Content Structure"]!);
    email_structure_issues.push("Suspiciously short email body");
  }

  // ── 13. Attachments ───────────────────────────────────────────────────────
  if (email.attachments) {
    const attachmentAnalysis = analyzeAttachments(email.attachments);
    cat["Attachments"] = attachmentAnalysis.risk_score;
    if (attachmentAnalysis.has_suspicious) risk_factors.push("Email contains high-risk attachment type(s)");
    detected_attachments.push(...attachmentAnalysis.detected_attachments);
  }

  // ── 14. Phrase density (advanced) ─────────────────────────────────────────
  const densityScore = calcPhraseDensity(fullText, totalPhraseMatches);
  if (densityScore > 0.05) {
    cat["Content Structure"] = Math.min((cat["Content Structure"] ?? 0) + densityScore, CAT_MAX["Content Structure"]!);
    if (densityScore > 0.10) email_structure_issues.push("High spam phrase density relative to email length");
  }

  // ── 15. Link density (advanced) ───────────────────────────────────────────
  const linkDensityScore = calcLinkDensity(email.email_body, urlAnalysis.count);
  if (linkDensityScore > 0) {
    cat["Suspicious Links"] = Math.min((cat["Suspicious Links"] ?? 0) + linkDensityScore, CAT_MAX["Suspicious Links"]!);
    email_structure_issues.push(`High link density (${urlAnalysis.count} links)`);
  }

  // ── 16. Legitimate signals (negative evidence) ────────────────────────────
  const legitScore = scoreLegitimate(fullText);

  // ── Bayesian combination ──────────────────────────────────────────────────
  // Use Noisy-OR for main category scores, then subtract legitimate signal weight
  const activeCategoryScores = Object.values(cat).filter((s) => s > 0);
  let spam_score = bayesianCombine(activeCategoryScores);

  // Apply legitimate signal penalty
  spam_score = Math.max(0, spam_score - legitScore * 0.6);

  // Co-occurrence boost: multiple independent attack vectors = strong signal
  const activeCatCount = Object.values(cat).filter((s) => s > 0.05).length;
  const boost = coOccurrenceBoost(activeCatCount);
  if (boost > 0) {
    spam_score = Math.min(spam_score + boost, 1);
    if (activeCatCount >= 4) {
      risk_factors.push(`Multi-vector threat: ${activeCatCount} attack categories detected simultaneously`);
    }
  }

  spam_score = Math.min(Math.max(spam_score, 0), 1);
  const isSpam = spam_score > 0.48;

  // Confidence via sigmoid (sharper curve with Bayesian scores)
  const distanceFromCenter = Math.abs(spam_score - 0.5);
  const rawConfidence = sigmoid(distanceFromCenter * 12 - 2);
  const confidence = Math.min(0.50 + rawConfidence * 0.49, 0.99);

  // Build breakdown — non-zero categories, sorted descending
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
    confidence,
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
