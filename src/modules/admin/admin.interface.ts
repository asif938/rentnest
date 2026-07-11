import { Prisma } from "../../../generated/prisma/browser";
import { Role } from "../../../generated/prisma/enums";

export interface IGetUsersQuery extends Prisma.UserWhereInput {
  searchTerm?: string;
  role?: Role;

  page?: string;
  limit?: string;

  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: Prisma.SortOrder;
}
