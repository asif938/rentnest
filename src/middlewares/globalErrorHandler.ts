import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../utils/AppError";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  let statusCode = httpStatus.INTERNAL_SERVER_ERROR as number;
  let message = "Something went wrong";
  let errorDetails: { field: string; message: string }[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails ?? [];
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    errorDetails = [
      {
        field: "request",
        message: "Invalid or missing data.",
      },
    ];
  }

  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = httpStatus.BAD_REQUEST;

    switch (err.code) {
      case "P2002":
        message = "Duplicate value";
        errorDetails = [
          {
            field: "unique",
            message: "A record with this value already exists.",
          },
        ];
        break;

      case "P2003":
        message = "Foreign key constraint failed";
        errorDetails = [
          {
            field: "relation",
            message: "Referenced record does not exist.",
          },
        ];
        break;

      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Resource not found";
        errorDetails = [
          {
            field: "id",
            message: "The requested resource does not exist.",
          },
        ];
        break;

      default:
        message = "Database Error";
    }
  }

  else if (err instanceof jwt.TokenExpiredError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Token has expired";
    errorDetails = [
      {
        field: "authorization",
        message: "Please login again.",
      },
    ];
  }

  else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token";
    errorDetails = [
      {
        field: "authorization",
        message: "Invalid access token.",
      },
    ];
  }

  else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};