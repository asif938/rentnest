import httpStatus from "http-status";
import { RequestStatus } from "../../../generated/prisma/enums";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

import { AppError } from "../../utils/AppError";
import Stripe from "stripe";
import { handleCheckoutCompleted } from "../../utils/handleCheckoutCompleted";
import { IPaymentQuery } from "./payment.interface";

const createPayment = async (
    tenantId: string,
    rentalRequestId: string
) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: {
            id: rentalRequestId,
        },
        include: {
            tenant: true,
            property: true,
            payment: true,
        },
    });

    if (!rentalRequest) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Rental request not found"
        );
    }

    if (rentalRequest.tenantId !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not allowed to pay for this rental request"
        );
    }

    if (rentalRequest.status !== RequestStatus.APPROVED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Rental request is not approved yet"
        );
    }

    if (rentalRequest.payment) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Payment already exists for this rental request"
        );
    }

    const start = new Date(rentalRequest.startDate);
    const end = new Date(rentalRequest.endDate);

    const totalDays = Math.ceil(
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (totalDays <= 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid rental duration"
        );
    }

    const totalMonths = Math.ceil(totalDays / 30);

    const amount = totalMonths * rentalRequest.property.price;

    const payment = await prisma.payment.create({
        data: {
            rentalRequestId,
            amount,
            provider: "Stripe",
            method: "Card",
        },
    });

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: rentalRequest.tenant.email,
        payment_method_types: ["card"],

        line_items: [
            {
                price_data: {
                    currency: "usd",

                    product_data: {
                        name: rentalRequest.property.title,
                        description: rentalRequest.property.location,
                    },

                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],

        metadata: {
            paymentId: payment.id,
            rentalRequestId,
            tenantId,
        },

        success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app_url}/payment/cancel`,
    });

    await prisma.payment.update({
        where: {
            id: payment.id,
        },
        data: {
            stripeSessionId: session.id,
        },
    });

    return {
        checkoutUrl: session.url,
    };
};

const handleWebhook = async (
    payload: Buffer,
    signature: string
) => {

    const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe_webhook_secret
    );

    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutCompleted(
                event.data.object as Stripe.Checkout.Session
            );

            break;

        default:
            console.log(
                `Unhandled event ${event.type}`
            );
    }

};

const getPaymentHistory = async (
    tenantId: string,
    query: IPaymentQuery
) => {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const where: any = {
        rentalRequest: {
            tenantId,
        },
    };

    if (query.status) {
        where.status = query.status;
    }

    const payments = await prisma.payment.findMany({

        where,

        include: {
            rentalRequest: {
                select: {
                    id: true,
                    startDate: true,
                    endDate: true,

                    property: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            price: true,
                            images: true,

                        },
                    },
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },

        skip,
        take: limit,

    });

    const total = await prisma.payment.count({
        where,
    });

    const formattedPayments = payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        rentalRequest: payment.rentalRequest,
    }));

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: formattedPayments,
    };

};

const getSinglePayment = async (
  tenantId: string,
  paymentId: string
) => {

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      rentalRequest: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              price: true,
              images: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment not found"
    );
  }

  if (payment.rentalRequest.tenantId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this payment"
    );
  }

  return {
    id: payment.id,
    amount: payment.amount,
    provider: payment.provider,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,

    rentalRequest: {
      id: payment.rentalRequest.id,
      startDate: payment.rentalRequest.startDate,
      endDate: payment.rentalRequest.endDate,

      property: payment.rentalRequest.property,
    },
  };

};

export const PaymentService = {
    createPayment,
    handleWebhook,
    getPaymentHistory,
    getSinglePayment
};