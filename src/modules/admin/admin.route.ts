import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { AdminController } from "./admin.controller";

const router = Router();

router.get(
  "/users",
  auth(Role.ADMIN),
  AdminController.getAllUsers
);

router.patch(
  "/users/:id",
  auth(Role.ADMIN),
  AdminController.updateUserStatus
);

router.get(
  "/properties",
  auth(Role.ADMIN),
  AdminController.getAllProperties
);

router.get(
  "/rentals",
  auth(Role.ADMIN),
  AdminController.getAllRentals
);

router.get(
  "/dashboard",
  auth(Role.ADMIN),
  AdminController.getDashboard
);

export const AdminRoutes = router;