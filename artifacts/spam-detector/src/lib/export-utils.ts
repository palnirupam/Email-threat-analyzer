import type { SpamAnalysis } from "@workspace/api-client-react";

/** Escapes special HTML characters to prevent XSS when injecting user data into HTML templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportAsCsv(analysis: SpamAnalysis, sender: string, subject: string) {
  const headers = [
    "Date", "Sender", "Subject", "Verdict", "Confidence", "Spam Score",
    "Risk Factors", "Suspicious Keywords", "Structure Issues",
    "Detected Attachments", "Sender Reputation Warning",
  ];

  const row = [
    new Date().toISOString(), sender, subject,
    analysis.isSpam ? "SPAM" : "CLEAN",
    analysis.confidence.toString(),
    analysis.spam_score.toString(),
    analysis.risk_factors.join("; "),
    analysis.details.suspicious_keywords.join("; "),
    analysis.details.email_structure_issues.join("; "),
    (analysis.details.detected_attachments || []).join("; "),
    analysis.details.sender_reputation_warning || "",
  ].map(field => `"${field.replace(/"/g, '""')}"`);

  const csvContent = [headers.join(","), row.join(",")].join("\n");
  downloadFile(csvContent, "spam-analysis.csv", "text/csv");
}

export function exportAsTxt(analysis: SpamAnalysis, sender: string, subject: string) {
  const content = `
SPAM ANALYSIS REPORT
====================
Date: ${new Date().toISOString()}
Sender: ${sender}
Subject: ${subject}

VERDICT: ${analysis.isSpam ? "SPAM" : "CLEAN"}
Confidence: ${(analysis.confidence * 100).toFixed(1)}%
Spam Score: ${analysis.spam_score}/100

RISK FACTORS:
${analysis.risk_factors.map(r => `- ${r}`).join("\n") || "None detected"}

DETAILS:
- Suspicious Keywords: ${analysis.details.suspicious_keywords.join(", ") || "None"}
- Structure Issues: ${analysis.details.email_structure_issues.join(", ") || "None"}
- Attachments: ${(analysis.details.detected_attachments || []).join(", ") || "None"}
- Reputation Warning: ${analysis.details.sender_reputation_warning || "None"}
  `.trim();

  downloadFile(content, "spam-analysis.txt", "text/plain");
}

function buildReportHtml(analysis: SpamAnalysis, sender: string, subject: string): string {
  const verdict = analysis.isSpam ? "SPAM / THREAT DETECTED" : "CLEAN";
  const verdictColor = analysis.isSpam ? "#ef4444" : "#22c55e";
  const confidencePercent = Math.round(analysis.confidence * 100);
  const date = new Date().toLocaleString();

  const riskRows = analysis.risk_factors.length
    ? analysis.risk_factors.map(r => `<li>${escapeHtml(r)}</li>`).join("")
    : "<li>None detected</li>";

  const keywords = analysis.details.suspicious_keywords.length
    ? analysis.details.suspicious_keywords.map(k => `<span class="badge">${escapeHtml(k)}</span>`).join(" ")
    : "None";

  const structureIssues = analysis.details.email_structure_issues.length
    ? analysis.details.email_structure_issues.map(i => `<li>${escapeHtml(i)}</li>`).join("")
    : "<li>None</li>";

  const attachments = (analysis.details.detected_attachments || []).length
    ? (analysis.details.detected_attachments || []).map(a => `<span class="badge">${escapeHtml(a)}</span>`).join(" ")
    : "None";

  const repWarning = analysis.details.sender_reputation_warning
    ? `<div class="warning-box">${escapeHtml(analysis.details.sender_reputation_warning)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Spam Analysis Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 40px 24px; }
    @media print { body { background: #fff; color: #111; } .card { border-color: #ccc !important; } }
    .container { max-width: 760px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid #21262d; padding-bottom: 20px; }
    .header h1 { font-family: monospace; font-size: 18px; letter-spacing: 0.15em; text-transform: uppercase; color: #58a6ff; }
    .meta { font-size: 12px; color: #8b949e; font-family: monospace; }
    .verdict { display: flex; align-items: center; gap: 16px; background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .verdict-label { font-size: 28px; font-weight: 800; color: ${verdictColor}; font-family: monospace; letter-spacing: 0.05em; }
    .verdict-sub { font-size: 13px; color: #8b949e; margin-top: 4px; font-family: monospace; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 20px; }
    .card-title { font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.12em; color: #8b949e; margin-bottom: 12px; }
    .score-bar-bg { height: 10px; background: #21262d; border-radius: 99px; overflow: hidden; margin-top: 8px; }
    .score-bar-fill { height: 100%; border-radius: 99px; background: ${analysis.spam_score > 70 ? "#ef4444" : analysis.spam_score > 40 ? "#f59e0b" : "#22c55e"}; width: ${analysis.spam_score}%; }
    .score-number { font-size: 26px; font-weight: 700; font-family: monospace; color: ${analysis.spam_score > 70 ? "#ef4444" : analysis.spam_score > 40 ? "#f59e0b" : "#22c55e"}; }
    ul { list-style: none; }
    ul li { padding: 6px 0; border-bottom: 1px solid #21262d; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
    ul li::before { content: "▸"; color: #f59e0b; flex-shrink: 0; margin-top: 2px; }
    .badge { display: inline-block; background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 2px 8px; font-family: monospace; font-size: 11px; color: #f59e0b; margin: 2px; }
    .warning-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 6px; padding: 12px; font-size: 13px; color: #fca5a5; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .full-card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 20px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; font-family: monospace; color: #484f58; letter-spacing: 0.08em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>&#9632; Spam Detector &mdash; Forensic Report</h1>
        <div class="meta">Generated: ${date}</div>
      </div>
    </div>

    <div class="verdict">
      <div>
        <div class="verdict-label">${verdict}</div>
        <div class="verdict-sub">Confidence: ${confidencePercent}%</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Threat Score</div>
        <div class="score-number">${analysis.spam_score}<span style="font-size:14px;color:#8b949e"> / 100</span></div>
        <div class="score-bar-bg"><div class="score-bar-fill"></div></div>
      </div>
      <div class="card">
        <div class="card-title">Email Details</div>
        <div style="font-size:13px;line-height:1.8">
          <div><span style="color:#8b949e">From: </span>${escapeHtml(sender) || "—"}</div>
          <div><span style="color:#8b949e">Subject: </span>${escapeHtml(subject) || "—"}</div>
        </div>
      </div>
    </div>

    <div class="section full-card">
      <div class="card-title">Identified Risks</div>
      <ul>${riskRows}</ul>
    </div>

    ${repWarning ? `<div class="section full-card"><div class="card-title">Reputation Warning</div>${repWarning}</div>` : ""}

    <div class="grid">
      <div class="card">
        <div class="card-title">Flagged Keywords</div>
        <div style="margin-top:4px">${keywords}</div>
      </div>
      <div class="card">
        <div class="card-title">Detected Attachments</div>
        <div style="margin-top:4px">${attachments}</div>
      </div>
    </div>

    <div class="section full-card">
      <div class="card-title">Structural Anomalies</div>
      <ul>${structureIssues}</ul>
    </div>

    <div class="footer">SPAM DETECTOR &bull; FORENSIC ANALYSIS &bull; ${date}</div>
  </div>
</body>
</html>`;
}

export function exportAsHtml(analysis: SpamAnalysis, sender: string, subject: string) {
  const html = buildReportHtml(analysis, sender, subject);
  downloadFile(html, "spam-analysis.html", "text/html");
}

export function exportAsPdf(analysis: SpamAnalysis, sender: string, subject: string) {
  const html = buildReportHtml(analysis, sender, subject);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) return;
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    URL.revokeObjectURL(url);
  };
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
