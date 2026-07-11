import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { LandlordController } from "./landlord.controller";

const router = Router();

router.get(
  "/requests",
  auth(Role.LANDLORD),
  LandlordController.getLandlordRequests
);

router.patch(
  "/requests/:id",
  auth(Role.LANDLORD),
  LandlordController.updateRentalStatus
);

router.get(
  "/dashboard",
  auth(Role.LANDLORD),
  LandlordController.getDashboard
);


export const LandlordRoutes = router