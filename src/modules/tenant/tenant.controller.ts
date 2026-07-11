import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TenantService } from "./tenant.service";

const getDashboard = catchAsync(
  async (req: Request, res: Response) => {

    const result = await TenantService.getDashboard(
      req.user!.id
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Dashboard retrieved successfully",
      data: result,
    });

  }
);

export const TenantController = {
  getDashboard,
};