import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { categoryController } from "./category.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
    "/",
    categoryController.getAllCategories
);

router.post(
    "/",
    auth(Role.ADMIN),
    categoryController.createCategory
);

router.patch(
    "/:id",
    auth(Role.ADMIN),
    categoryController.updateCategory
);

router.delete(
    "/:id",
    auth(Role.ADMIN),
    categoryController.deleteCategory
);

export const CategoryRoutes = router;