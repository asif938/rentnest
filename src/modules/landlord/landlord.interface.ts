import { RequestStatus } from "../../../generated/prisma/enums";

export interface ILandlordRentalQuery {
  page?: string;
  limit?: string;
  status?: RequestStatus;
}

export interface IUpdateRentalStatus {
  status: RequestStatus;
}