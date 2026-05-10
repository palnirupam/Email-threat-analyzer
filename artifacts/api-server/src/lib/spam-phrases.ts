// ─── Weighted phrase categories ──────────────────────────────────────────────
// Each entry: [phrase, weight 0..1]  weight contributes directly to spam_score

export const FINANCIAL_LURE: [string, number][] = [
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

export const PHISHING: [string, number][] = [
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

export const MARKETING_SPAM: [string, number][] = [
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

export const ADULT_GAMBLING: [string, number][] = [
  ["casino", 0.14], ["online casino", 0.18], ["slot machine", 0.16],
  ["poker", 0.08], ["blackjack", 0.10], ["sports betting", 0.12],
  ["place your bet", 0.14], ["free spins", 0.16], ["bonus chips", 0.12],
  ["viagra", 0.30], ["cialis", 0.30], ["levitra", 0.30],
  ["erectile", 0.22], ["enlargement", 0.20], ["male enhancement", 0.24],
  ["adult dating", 0.24], ["meet singles", 0.14], ["hot singles", 0.18],
  ["hookup", 0.18], ["dating site", 0.08],
];

export const HEALTH_SCAM: [string, number][] = [
  ["weight loss", 0.12], ["lose weight fast", 0.16], ["burn fat", 0.12],
  ["miracle cure", 0.20], ["clinically proven", 0.10], ["doctors hate", 0.20],
  ["secret formula", 0.16], ["natural remedy", 0.08], ["herbal supplement", 0.08],
  ["detox", 0.06], ["anti-aging", 0.06], ["wrinkle free", 0.10],
  ["work from home", 0.12], ["earn money online", 0.14], ["passive income", 0.10],
  ["financial freedom", 0.10], ["be your own boss", 0.12],
];

export const CRYPTO_SCAM: [string, number][] = [
  ["bitcoin", 0.10], ["ethereum", 0.08], ["crypto", 0.08],
  ["cryptocurrency", 0.08], ["blockchain investment", 0.14],
  ["crypto wallet", 0.12], ["send bitcoin", 0.22], ["send crypto", 0.20],
  ["nft mint", 0.14], ["token sale", 0.12], ["ico investment", 0.14],
  ["rugpull", 0.24], ["pump and dump", 0.24], ["guaranteed returns", 0.18],
  ["1000x returns", 0.22], ["100x profit", 0.20],
];

// Legitimate signals — reduce spam score
export const LEGITIMATE_SIGNALS: [string, number][] = [
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
export const BRAND_NAMES = [
  "paypal", "amazon", "apple", "google", "microsoft", "netflix", "facebook",
  "instagram", "twitter", "linkedin", "whatsapp", "ebay", "walmart", "fedex",
  "ups", "dhl", "irs", "bank of america", "chase", "wells fargo", "citibank",
  "hsbc", "barclays", "halifax", "lloyds", "natwest",
];

// Suspicious free/disposable domains
export const SUSPICIOUS_DOMAINS = [
  "tempmail", "guerrillamail", "mailinator", "throwaway", "disposable",
  "fakeinbox", "trashmail", "yopmail", "getairmail", "sharklasers",
  "guerrillamailblock", "grr.la", "spam4.me", "binkmail", "dispostable",
  "mailnull", "maildrop", "tempr.email", "throwam", "tempm",
];

// Suspicious TLDs (high-abuse registries)
export const SUSPICIOUS_TLDS = [
  ".xyz", ".tk", ".ml", ".ga", ".cf", ".top", ".click",
  ".download", ".loan", ".work", ".date", ".faith", ".racing", ".stream", ".gq",
];

export const SUSPICIOUS_SENDER_PATTERNS = [
  /[0-9]{5,}@/,
  /admin@.*\.(xyz|tk|ml|ga|cf|top)$/i,
  /support@.*\.(xyz|tk|ml|ga|cf|top)$/i,
  /noreply-[a-z0-9]+@(?!.*\.(com|org|net|edu|gov|co\.[a-z]{2})$)/i,
  /[a-z]{2,6}[0-9]{4,}@/,
  /no[-_]?reply@[a-z0-9-]+\.[a-z]{2,3}[^.]/i,
];

// Personal data request phrases
export const PERSONAL_DATA_PHRASES: [string, number][] = [
  ["your password", 0.18], ["credit card number", 0.24], ["card number", 0.16],
  ["bank account", 0.18], ["bank details", 0.18], ["social security", 0.22],
  ["confirm identity", 0.16], ["your pin", 0.22], ["cvv", 0.20], ["expiry date", 0.14],
  ["routing number", 0.20], ["account number", 0.14],
];

// Urgency amplifier words
export const URGENCY_WORDS = [
  "urgent", "immediately", "asap", "hurry", "expire", "expiring",
  "act now", "right now", "today only", "within 24 hours", "within 48 hours",
  "don't delay", "last chance", "final warning", "final notice",
];

// Known obfuscated spam terms
export const OBFUSCATED_TERMS = [
  "v1agra", "c1alis", "fr33", "fr@e", "s3x", "p0rn", "c4sh", "w1n", "pr1ze",
];

// Max possible contribution per category (used for proportional bar width)
export const CAT_MAX: Record<string, number> = {
  "Financial Lure": 1.0,
  "Phishing": 1.0,
  "Marketing Spam": 0.6,
  "Adult/Gambling": 0.8,
  "Health Scam": 0.5,
  "Crypto Scam": 0.5,
  "Personal Data": 0.8,
  "Urgency Language": 0.25,
  "Suspicious Links": 0.6,
  "Brand Spoofing": 0.36,
  "Sender Reputation": 0.30,
  "Content Structure": 0.6,
  "Attachments": 0.55,
};
