import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { RentalService } from "./rental.service";
import { ICreateRentalRequest } from "./rental.interface";

const createRentalRequest = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {
    const { propertyId, startDate, endDate } = req.body;

    const errorDetails: { field: string; message: string }[] = [];

    if (!propertyId) {
      errorDetails.push({
        field: "propertyId",
        message: "Property is required",
      });
    }

    if (!startDate) {
      errorDetails.push({
        field: "startDate",
        message: "Start date is required",
      });
    }

    if (!endDate) {
      errorDetails.push({
        field: "endDate",
        message: "End date is required",
      });
    }

    if (errorDetails.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Validation Error",
        errorDetails
      );
    }

    const result = await RentalService.createRentalRequest(
      req.user!.id,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Rental request submitted successfully",
      data: result,
    });
  }
);

const getMyRentals = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await RentalService.getMyRentals(
      req.user!.id,
      req.query
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental requests retrieved successfully",
      data: result.data,
      meta: result.meta,
    });

  }
);

const getSingleRental = catchAsync(
    async (
        req: Request,
        res: Response
    ) => {

        const id = req.params.id as string;

        if (!id.trim()) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Validation Error",
                [
                    {
                        field: "id",
                        message: "Rental request id is required"
                    }
                ]
            );
        }

        const result = await RentalService.getSingleRental(
            id,
            req.user!.id
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Rental request retrieved successfully",
            data: result
        });

    }
);

export const RentalController = {
  createRentalRequest,
  getMyRentals,
  getSingleRental
};

