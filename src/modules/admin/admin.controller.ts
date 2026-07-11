import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { AdminService } from "./admin.service";
import { IGetUsersQuery } from "./admin.interface";
import { AppError } from "../../utils/AppError";

const getAllUsers = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    const result = await AdminService.getAllUsers(req.query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users retrieved successfully",
      data: result.data,
      meta: result.meta,
    });

  }
);

const updateUserStatus = catchAsync(
  async (
    req: Request,
    res: Response
  ) => {

    if (typeof req.body.isBanned !== "boolean") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Validation Error",
        [
          {
            field: "isBanned",
            message: "isBanned must be true or false",
          },
        ]
      );
    }

    const result = await AdminService.updateUserStatus(
      req.params.id as string,
      req.body.isBanned
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `User ${
        result.isBanned ? "banned" : "unbanned"
      } successfully`,
      data: result,
    });

  }
);

const getAllProperties = catchAsync(
  async (req: Request, res: Response) => {

    const result = await AdminService.getAllProperties();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Properties retrieved successfully",
      data: result,
    });

  }
);

const getAllRentals = catchAsync(
  async (req: Request, res: Response) => {

    const result = await AdminService.getAllRentals();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental requests retrieved successfully",
      data: result,
    });

  }
);

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentals
};