import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { PropertyController } from "./property.controller";

const router = Router();

router.post(
  "/",
  auth(Role.LANDLORD),
  PropertyController.createProperty
);

router.get(
    "/",
    PropertyController.getAllProperties
);

router.get(
    "/:id",
    PropertyController.getSingleProperty
);

router.patch(
  "/:id",
  auth(Role.LANDLORD),
  PropertyController.updateProperty
);

router.delete(
  "/:id",
  auth(Role.LANDLORD),
  PropertyController.deleteProperty
);

export const PropertyRoutes = router;