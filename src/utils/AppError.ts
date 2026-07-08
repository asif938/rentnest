
export class AppError extends Error {
  statusCode: number;
  errorDetails?: { field: string; message: string }[];

  constructor(
    statusCode: number,
    message: string,
    errorDetails?: { field: string; message: string }[]
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errorDetails = errorDetails;

    Error.captureStackTrace(this, this.constructor);
  }
}