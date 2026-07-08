import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const createCategory = async (payload: { name: string }) => {

    const existing = await prisma.category.findUnique({
        where: {
            name: payload.name
        }
    });

    if (existing) {
        throw new AppError(409, "Category already exists");
    }

    const result = await prisma.category.create({
        data: payload
    });

    return result;
}

const getAllCategories = async () => {

    return await prisma.category.findMany({
        orderBy: {
            name: "asc"
        }
    });

}

const updateCategory = async (
    id: string,
    payload: { name: string }
) => {

    const category = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (!category) {
        throw new AppError(404, "Category not found");
    }

    const existing = await prisma.category.findFirst({
        where: {
            name: payload.name,
            NOT: {
                id
            }
        }
    });

    if (existing) {
        throw new AppError(409, "Category already exists");
    }

    return await prisma.category.update({
        where: {
            id
        },
        data: payload
    });

}

const deleteCategory = async (id: string) => {

    const category = await prisma.category.findUnique({
        where: {
            id
        },
        include: {
            properties: true
        }
    });

    if (!category) {
        throw new AppError(404, "Category not found");
    }

    if (category.properties.length > 0) {
        throw new AppError(
            400,
            "Cannot delete category because it is assigned to properties."
        );
    }

    await prisma.category.delete({
        where: {
            id
        }
    });

    return null;

}

export const categoryService = {
    deleteCategory,
    getAllCategories,
    updateCategory,
    createCategory
}