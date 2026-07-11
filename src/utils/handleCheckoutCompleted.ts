import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { PaymentStatus, RequestStatus } from "../../generated/prisma/enums";

export const handleCheckoutCompleted = async (
  session: Stripe.Checkout.Session
) => {

  const paymentId = session.metadata?.paymentId;

  if (!paymentId) {
    console.log("Payment id missing.");
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.$transaction(async (tx) => {

    const payment = await tx.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      console.log("Payment not found.");
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return;
    }

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        transactionId: paymentIntentId,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    await tx.rentalRequest.update({
      where: {
        id: payment.rentalRequestId,
      },
      data: {
        status: RequestStatus.COMPLETED,
      },
    });

  });

};