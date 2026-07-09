import { RequestStatus } from "../../../generated/prisma/enums";

export interface ICreateRentalRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
}

export interface IRentalQuery {
  page?: string;
  limit?: string;
  status?: RequestStatus;
}

export interface IIdParams {
    id: string;
}