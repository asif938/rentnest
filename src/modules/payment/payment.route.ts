import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/create", auth(Role.TENANT), PaymentController.createPayment);
router.post("/webhook", PaymentController.handleWebhook);
router.get("/", auth(Role.TENANT), PaymentController.getPaymentHistory);
router.get("/:id", auth(Role.TENANT), PaymentController.getSinglePayment
);

export const PaymentRoutes = router;
