import { PaymentStatus, Prisma, RequestStatus, Role } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IGetUsersQuery } from "./admin.interface";
import httpStatus from 'http-status';

const getAllUsers = async (
    query: IGetUsersQuery
) => {

    const {
        searchTerm,
        role,
        page = "1",
        limit = "10",
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const where: Prisma.UserWhereInput = {};

    if (searchTerm) {
        where.OR = [
            {
                name: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            },
            {
                email: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (role) {
        where.role = role;
    }

    const skip =
        (Number(page) - 1) * Number(limit);

    const [users, total] = await prisma.$transaction([

        prisma.user.findMany({
            where,
            skip,
            take: Number(limit),

            orderBy: {
                [sortBy]: sortOrder,
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                profilePhoto: true,
                createdAt: true,
            },
        }),

        prisma.user.count({
            where,
        }),

    ]);

    return {

        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },

        data: users,

    };

};

const updateUserStatus = async (
    userId: string,
    isBanned: boolean
) => {

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "User not found"
        );
    }

    if (user.role === Role.ADMIN) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Admin account cannot be banned"
        );
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            isBanned,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};

const getAllProperties = async () => {

    const properties = await prisma.property.findMany({
        include: {
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            category: {
                select: {
                    id: true,
                    name: true,
                },
            },

            reviews: {
                select: {
                    rating: true,
                },
            },
        },
    });

    const formattedProperties = properties.map((property) => {

        const ratings = property.reviews.map(
            (review) => review.rating
        );

        const totalReviews = ratings.length;

        const averageRating =
            totalReviews === 0
                ? 0
                : Number(
                    (
                        ratings.reduce((sum, rating) => sum + rating, 0) /
                        totalReviews
                    ).toFixed(1)
                );

        return {
            id: property.id,
            title: property.title,
            description: property.description,
            price: property.price,
            location: property.location,
            amenities: property.amenities,
            images: property.images,
            isAvailable: property.isAvailable,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            landlord: property.landlord,
            category: property.category,
            averageRating,
            totalReviews,
        };

    });

    return formattedProperties;
};

const getAllRentals = async () => {

    const rentals = await prisma.rentalRequest.findMany({
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

                    landlord: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },

                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                },
            },

            payment: {
                select: {
                    id: true,
                    amount: true,
                    provider: true,
                    method: true,
                    status: true,
                    transactionId: true,
                    paidAt: true,
                },
            },

        },

        orderBy: {
            createdAt: "desc",
        },
    });

    return rentals;
};

const getDashboard = async () => {

    const [
        totalUsers,
        totalTenants,
        totalLandlords,

        totalProperties,
        availableProperties,

        totalRentals,
        pendingRentals,
        approvedRentals,
        completedRentals,

        totalPayments,

        paymentAggregate,
    ] = await prisma.$transaction([

        prisma.user.count(),

        prisma.user.count({
            where: {
                role: Role.TENANT,
            },
        }),

        prisma.user.count({
            where: {
                role: Role.LANDLORD,
            },
        }),

        prisma.property.count(),

        prisma.property.count({
            where: {
                isAvailable: true,
            },
        }),

        prisma.rentalRequest.count(),

        prisma.rentalRequest.count({
            where: {
                status: RequestStatus.PENDING,
            },
        }),

        prisma.rentalRequest.count({
            where: {
                status: RequestStatus.APPROVED,
            },
        }),

        prisma.rentalRequest.count({
            where: {
                status: RequestStatus.COMPLETED,
            },
        }),

        prisma.payment.count({
            where: {
                status: PaymentStatus.COMPLETED,
            },
        }),

        prisma.payment.aggregate({
            where: {
                status: PaymentStatus.COMPLETED,
            },
            _sum: {
                amount: true,
            },
        }),

    ]);

    return {

        users: {
            total: totalUsers,
            tenants: totalTenants,
            landlords: totalLandlords,
        },

        properties: {
            total: totalProperties,
            available: availableProperties,
            rented: totalProperties - availableProperties,
        },

        rentals: {
            total: totalRentals,
            pending: pendingRentals,
            approved: approvedRentals,
            completed: completedRentals,
        },

        payments: {
            completedPayments: totalPayments,
            totalRevenue: paymentAggregate._sum.amount ?? 0,
        },

    };

};

export const AdminService = {
    getAllUsers,
    updateUserStatus,
    getAllProperties,
    getAllRentals,
    getDashboard
};