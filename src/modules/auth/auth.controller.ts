import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { authService } from "./auth.service";
import { Role } from "../../../generated/prisma/enums";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  const errorDetails: { field: string; message: string }[] = [];

  if (!name || name.trim() === "") {
    errorDetails.push({
      field: "name",
      message: "Name is required",
    });
  }

  if (!email || email.trim() === "") {
    errorDetails.push({
      field: "email",
      message: "Email is required",
    });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errorDetails.push({
        field: "email",
        message: "Invalid email address",
      });
    }
  }

  if (!password) {
    errorDetails.push({
      field: "password",
      message: "Password is required",
    });
  } else {
    if (password.length < 6) {
      errorDetails.push({
        field: "password",
        message: "Password must be at least 6 characters",
      });
    }

    if (password.length > 20) {
      errorDetails.push({
        field: "password",
        message: "Password cannot exceed 20 characters",
      });
    }
  }

  if (!role) {
    errorDetails.push({
      field: "role",
      message: "Role is required",
    });
  } else if (![Role.TENANT, Role.LANDLORD].includes(role)) {
    errorDetails.push({
      field: "role",
      message: "Role must be TENANT or LANDLORD",
    });
  }


  if (errorDetails.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Validation Error",
      errorDetails
    );
  }

  const result = await authService.registerUser({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: result,
  });

});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;


  if (!email) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const result = await authService.loginUser({
    email,
    password,
  });

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 
  })

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Login successful",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile retrieved successfully",
    data: result,
  });
});

export const authController = {
  registerUser,
  loginUser,
  getMe
};