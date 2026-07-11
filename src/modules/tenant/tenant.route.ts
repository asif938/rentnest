import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { TenantController } from "./tenant.controller";

const router = Router();

router.get(
  "/dashboard",
  auth(Role.TENANT),
  TenantController.getDashboard
);

export const RentalRoutes = router;