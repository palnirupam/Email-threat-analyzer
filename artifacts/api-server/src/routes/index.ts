import { Router, type IRouter } from "express";
import healthRouter from "./health";
import spamRouter from "./spam";

const router: IRouter = Router();

router.use(healthRouter);
router.use(spamRouter);

export default router;
