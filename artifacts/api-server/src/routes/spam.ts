import { Router, type IRouter } from "express";
import { analyzeSpam } from "../lib/spam-detector";
import { AnalyzeSpamBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analyze-spam", (req, res): void => {
  const parsed = AnalyzeSpamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email_body, subject, sender_email, attachments } = parsed.data;

  if (!email_body && !subject) {
    res.status(400).json({ error: "Email body or subject is required" });
    return;
  }

  try {
    const result = analyzeSpam({ email_body, subject, sender_email, attachments });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Spam analysis failed");
    res.status(500).json({ error: "Failed to analyze email" });
  }
});

export default router;
