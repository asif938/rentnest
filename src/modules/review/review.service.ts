import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateReview, IUpdateReview } from "./review.interface";
import { PaymentStatus, RequestStatus } from "../../../generated/prisma/enums";

const createReview = async (tenantId: string, payload: ICreateReview) => {

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

    const rental = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
            status: RequestStatus.COMPLETED,
        },
        include: {
            payment: true,
        },
    });

    if (!rental) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You can review only after completing the rental."
        );
    }

    if (!rental.payment || rental.payment.status !== PaymentStatus.COMPLETED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Payment must be completed before reviewing."
        );
    }

    const existingReview = await prisma.review.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
        },
    });

    if (existingReview) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You have already reviewed this property."
        );
    }

    const review = await prisma.review.create({
        data: {
            tenantId,
            propertyId: payload.propertyId,
            rating: payload.rating,
            comment: payload.comment,
        },
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return review;
};


const getPropertyReviews = async (
    propertyId: string
) => {

    const property = await prisma.property.findUnique({
        where: {
            id: propertyId,
        },
    });

    if (!property) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Property not found"
        );
    }

    const reviews = await prisma.review.findMany({
        where: {
            propertyId,
        },
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const totalReviews = reviews.length;

    const averageRating =
        totalReviews === 0
            ? 0
            : Number(
                (
                    reviews.reduce(
                        (sum, review) => sum + review.rating,
                        0
                    ) / totalReviews
                ).toFixed(1)
            );

    return {
        propertyId,
        averageRating,
        totalReviews,
        reviews,
    };
};

const updateReview = async (
    tenantId: string,
    reviewId: string,
    payload: IUpdateReview
) => {

    const review = await prisma.review.findUnique({
        where: {
            id: reviewId,
        },
    });

    if (!review) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Review not found"
        );
    }

    if (review.tenantId !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not allowed to update this review"
        );
    }

    const data: IUpdateReview = {};

    if (payload.rating !== undefined) {

        if (payload.rating < 1 || payload.rating > 5) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Rating must be between 1 and 5"
            );
        }

        data.rating = payload.rating;
    }

    if (payload.comment !== undefined) {
        data.comment = payload.comment.trim();
    }

    const updatedReview = await prisma.review.update({
        where: {
            id: reviewId,
        },
        data,
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return updatedReview;
};

export const ReviewService = {
    createReview,
    getPropertyReviews,
    updateReview
};