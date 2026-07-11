import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

import { PaymentService } from "./payment.service";
import { ICreatePayment } from "./payment.interface";

const createPayment = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const { rentalRequestId } = req.body;

    const errorDetails: { field: string; message: string }[] = [];

    if (!rentalRequestId?.trim()) {
      errorDetails.push({
        field: "rentalRequestId",
        message: "Rental request id is required",
      });
    }

    if (errorDetails.length) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Validation Error",
        errorDetails
      );
    }

    const result = await PaymentService.createPayment(
      req.user!.id,
      rentalRequestId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Checkout session created successfully",
      data: result,
    });

  }
);

const handleWebhook = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body as Buffer;
    const signature = req.headers["stripe-signature"] as string;

    await PaymentService.handleWebhook(
      payload,
      signature
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Webhook received successfully",
      data: null,
    });

  }
);

const getPaymentHistory = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await PaymentService.getPaymentHistory(
      req.user!.id,
      req.query
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment history retrieved successfully",
      data: result.data,
      meta: result.meta,
    });

  }
);

export const PaymentController = {
  createPayment,
  handleWebhook,
  getPaymentHistory
};