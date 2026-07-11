import {
  PaymentStatus,
  RequestStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

const getDashboard = async (tenantId: string) => {

  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    completedRequests,

    paymentStats,

    totalReviews,

    recentRentals,
  ] = await prisma.$transaction([

    prisma.rentalRequest.count({
      where: {
        tenantId,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        tenantId,
        status: RequestStatus.PENDING,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        tenantId,
        status: RequestStatus.APPROVED,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        tenantId,
        status: RequestStatus.COMPLETED,
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
        rentalRequest: {
          tenantId,
        },
      },
      _count: true,
      _sum: {
        amount: true,
      },
    }),

    prisma.review.count({
      where: {
        tenantId,
      },
    }),

    prisma.rentalRequest.findMany({
      where: {
        tenantId,
      },
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
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

  ]);

  return {

    rentalRequests: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      completed: completedRequests,
    },

    payments: {
      completedPayments: paymentStats._count,
      totalSpent: paymentStats._sum.amount ?? 0,
    },

    reviews: {
      total: totalReviews,
    },

    recentRentals,

  };

};

export const TenantService = {
  getDashboard,
};