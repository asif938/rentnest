import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

import { ReviewService } from "./review.service";
import { ICreateReview } from "./review.interface";
import { IPropertyReviewParams } from "./review.interface";

const createReview = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const { propertyId, rating, comment } = req.body;

    const errorDetails: { field: string; message: string }[] = [];

    if (!propertyId) {
      errorDetails.push({
        field: "propertyId",
        message: "Property is required",
      });
    }

    if (!rating) {
      errorDetails.push({
        field: "rating",
        message: "Rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      errorDetails.push({
        field: "rating",
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment) {
      errorDetails.push({
        field: "comment",
        message: "Comment is required",
      });
    }

    if (errorDetails.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Validation Error",
        errorDetails
      );
    }

    const result = await ReviewService.createReview(
      req.user!.id,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Review submitted successfully",
      data: result,
    });

  }
);


const getPropertyReviews = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await ReviewService.getPropertyReviews(
      req.params.propertyId as string
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Property reviews retrieved successfully",
      data: result,
    });

  }
);

const updateReview = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await ReviewService.updateReview(
      req.user!.id,
      req.params.id as string,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Review updated successfully",
      data: result,
    });

  }
);


export const ReviewController = {
  createReview,
  getPropertyReviews,
  updateReview
};