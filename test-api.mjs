const data = {
  subject: "",
  sender_email: "",
  email_body: `Hello,

During a scheduled continuity assessment involving recently synchronized collaboration environments, several metadata associations connected to your authenticated workspace profile were flagged for secondary validation processing.

While no direct user action is currently required, temporary inconsistencies may persist across integrated resource layers until automated reconciliation procedures complete successfully.

Environment review portal:
https://example.com/workspace-review

If synchronization anomalies continue beyond the next scheduled update interval, additional review operations may be initiated automatically.

Regards,
Collaborative Systems Integrity Division`
};

fetch("http://localhost:8080/api/analyze-spam", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
