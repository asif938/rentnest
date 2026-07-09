import httpStatus from "http-status";
import { RequestStatus } from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import { ICreateRentalRequest, IRentalQuery } from "./rental.interface";
import { Prisma } from "../../../generated/prisma/browser";

const createRentalRequest = async (
    tenantId: string,
    payload: ICreateRentalRequest
) => {

    const property = await prisma.property.findUnique({
        where: {
            id: payload.propertyId,
        },
    });

    if (!property) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Property not found"
        );
    }

    if (!property.isAvailable) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Property is not available"
        );
    }

    if (property.landlordId === tenantId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You cannot rent your own property"
        );
    }

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid date format"
        );
    }

    if (startDate >= endDate) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "End date must be after start date"
        );
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Start date cannot be in the past"
        );
    }


    const existingRequest = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
            status: {
                in: [
                    RequestStatus.PENDING,
                    RequestStatus.APPROVED,
                ],
            },
        },
    });

    if (existingRequest) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You already have an active rental request for this property"
        );
    }

    const overlappingRental = await prisma.rentalRequest.findFirst({
        where: {
            propertyId: payload.propertyId,
            status: RequestStatus.APPROVED,
            AND: [
                {
                    startDate: {
                        lte: endDate,
                    },
                },
                {
                    endDate: {
                        gte: startDate,
                    },
                },
            ],
        },
    });

    if (overlappingRental) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Property is already booked for the selected dates"
        );
    }

    const rentalRequest = await prisma.rentalRequest.create({
        data: {
            tenantId,
            propertyId: payload.propertyId,
            startDate,
            endDate,
            status: RequestStatus.PENDING,
        },

        include: {
            property: {
                include: {
                    category: true,
                    landlord: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    return rentalRequest;
};

const getMyRentals = async (
    tenantId: string,
    query: IRentalQuery
) => {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalRequestWhereInput = {
        tenantId,
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

const getSingleRental = async (
    rentalId: string,
    tenantId: string
) => {

    const rental = await prisma.rentalRequest.findFirst({

        where: {
            id: rentalId,
            tenantId
        },

        include: {

            property: {

                include: {

                    category: true,

                    landlord: {

                        select: {
                            id: true,
                            name: true,
                            email: true
                        }

                    }

                }

            },

            payment: true

        }

    });

    if (!rental) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Rental request not found"
        );
    }

    return rental;

};

export const RentalService = {
    createRentalRequest,
    getMyRentals,
    getSingleRental
};