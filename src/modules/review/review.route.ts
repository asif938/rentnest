import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { ReviewController } from "./review.controller";

const router = Router();

router.post("/", auth(Role.TENANT), ReviewController.createReview);
router.get("/property/:propertyId", ReviewController.getPropertyReviews);
router.patch("/:id", auth(Role.TENANT), ReviewController.updateReview);
router.delete("/:id", auth(Role.TENANT), ReviewController.deleteReview);

export const ReviewRoutes = router;