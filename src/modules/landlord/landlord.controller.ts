import { catchAsync } from "../../utils/catchAsync";
import httpStatus from 'http-status'
import { sendResponse } from "../../utils/sendResponse";
import { LandlordService } from "./landlord.service";
import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { RequestStatus } from "../../../generated/prisma/enums";

const getLandlordRequests = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await LandlordService.getLandlordRequests(
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

const updateRentalStatus = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const id = req.params.id as string;
    const { status } = req.body;

    const errorDetails: { field: string; message: string }[] = [];

    if (!id.trim()) {
      errorDetails.push({
        field: "id",
        message: "Rental request id is required",
      });
    }

    if (!status) {
      errorDetails.push({
        field: "status",
        message: "Status is required",
      });
    }

    if (
      status &&
      status !== RequestStatus.APPROVED &&
      status !== RequestStatus.REJECTED
    ) {
      errorDetails.push({
        field: "status",
        message: "Status must be APPROVED or REJECTED",
      });
    }

    if (errorDetails.length) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Validation Error",
        errorDetails
      );
    }

    const result = await LandlordService.updateRentalStatus(
      id,
      req.user!.id,
      status
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Rental request ${status.toLowerCase()} successfully`,
      data: result,
    });
  }
);

export const LandlordController = {
    getLandlordRequests,
    updateRentalStatus
}