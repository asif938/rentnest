import { PaymentStatus, Prisma, RequestStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ILandlordRentalQuery } from "./landlord.interface";
import httpStatus from 'http-status';

const getLandlordRequests = async (
  landlordId: string,
  query: ILandlordRentalQuery
) => {

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.RentalRequestWhereInput = {

    property: {
      landlordId,
    },

  };

  if (query.status) {
    where.status = query.status;
  }

  const total = await prisma.rentalRequest.count({
    where,
  });

  const rentals = await prisma.rentalRequest.findMany({
    where,

    skip,

    take: limit,

    orderBy: {
      createdAt: "desc",
    },

    include: {

      tenant: {

        select: {
          id: true,
          name: true,
          email: true,

          reviews: {

            select: {
              rating: true,
            },

          },

        },

      },

      property: {

        include: {
          category: true,
        },

      },

      payment: true,

    },

  });

  return {

    meta: {
      page,
      limit,
      total,
    },

    data: rentals,

  };

};

const updateRentalStatus = async (
  rentalId: string,
  landlordId: string,
  status: RequestStatus
) => {

  const rental = await prisma.rentalRequest.findUnique({
    where: {
      id: rentalId,
    },
    include: {
      property: true,
    },
  });

  if (!rental) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Rental request not found"
    );
  }

  if (rental.property.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this rental request"
    );
  }

  if (rental.status !== RequestStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending rental requests can be updated"
    );
  }

  if (status === RequestStatus.APPROVED) {

    const overlap = await prisma.rentalRequest.findFirst({
      where: {
        propertyId: rental.propertyId,
        id: {
          not: rental.id,
        },
        status: RequestStatus.APPROVED,
        AND: [
          {
            startDate: {
              lte: rental.endDate,
            },
          },
          {
            endDate: {
              gte: rental.startDate,
            },
          },
        ],
      },
    });

    if (overlap) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Property is already booked for these dates"
      );
    }
  }

  const updatedRental = await prisma.rentalRequest.update({

    where: {
      id: rentalId,
    },

    data: {
      status,
      approvedAt:
        status === RequestStatus.APPROVED
          ? new Date()
          : null,
      rejectedAt:
        status === RequestStatus.REJECTED
          ? new Date()
          : null,
    },

    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        include: {
          category: true,
        },
      },
    },
  });

  return updatedRental;
};

const getDashboard = async (landlordId: string) => {

  const [
    totalProperties,
    availableProperties,

    totalRequests,
    pendingRequests,
    approvedRequests,
    completedRequests,

    paymentStats,
    recentRequests,
  ] = await prisma.$transaction([

    prisma.property.count({
      where: {
        landlordId,
      },
    }),

    prisma.property.count({
      where: {
        landlordId,
        isAvailable: true,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        property: {
          landlordId,
        },
      },
    }),

    prisma.rentalRequest.count({
      where: {
        property: {
          landlordId,
        },
        status: RequestStatus.PENDING,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        property: {
          landlordId,
        },
        status: RequestStatus.APPROVED,
      },
    }),

    prisma.rentalRequest.count({
      where: {
        property: {
          landlordId,
        },
        status: RequestStatus.COMPLETED,
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
        rentalRequest: {
          property: {
            landlordId,
          },
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    prisma.rentalRequest.findMany({
      where: {
        property: {
          landlordId,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            location: true,
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
    properties: {
      total: totalProperties,
      available: availableProperties,
      rented: totalProperties - availableProperties,
    },

    rentalRequests: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      completed: completedRequests,
    },

    earnings: {
      totalRevenue: paymentStats._sum.amount ?? 0,
      completedPayments: paymentStats._count,
    },

    recentRequests,
  };
};

export const LandlordService = {
  getLandlordRequests,
  updateRentalStatus,
  getDashboard
}