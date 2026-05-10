import { analyzeSpam } from "./artifacts/api-server/dist/index.mjs";

const email = {
  subject: "",
  sender_email: "admin@example.org",
  email_body: `Dear User,

An indexing operation affecting archived internal resources completed earlier today and may temporarily affect retrieval latency for synchronized content categories.

System reference portal:
https://portal.example.org/resource-index

Regards,
Automated Resource Operations`,
  attachments: null
};

console.log(JSON.stringify(analyzeSpam(email), null, 2));
