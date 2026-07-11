import { PaymentStatus } from "../../../generated/prisma/enums";

export interface ICreatePayment {
  rentalRequestId: string;
}

export interface IPaymentQuery {
  page?: string;
  limit?: string;
  status?: PaymentStatus;
}

export interface IPaymentParams {
  id: string;
}