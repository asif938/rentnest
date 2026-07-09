import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { RentalController } from "./rental.controller";

const router = Router();

router.post(
    "/",
    auth(Role.TENANT),
    RentalController.createRentalRequest
);

router.get(
  "/",
  auth(Role.TENANT),
  RentalController.getMyRentals
);

router.get(
    "/:id",
    auth(Role.TENANT),
    RentalController.getSingleRental
);

export const RentalRoutes = router;