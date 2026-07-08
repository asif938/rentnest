import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(async (req, res) => {

    const { name } = req.body;

    if (!name) {
        throw new AppError(
            400,
            "Validation Error",
            [
                {
                    field: "name",
                    message: "Category name is required"
                }
            ]
        );
    }

    const result = await categoryService.createCategory({
        name
    });

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Category created successfully",
        data: result
    });

});

const getAllCategories = catchAsync(async (req, res) => {

    const result = await categoryService.getAllCategories();

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Categories retrieved successfully",
        data: result
    });

});

const updateCategory = catchAsync(async (req, res) => {

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        throw new AppError(
            400,
            "Validation Error",
            [
                {
                    field: "name",
                    message: "Category name is required"
                }
            ]
        );
    }

    const result = await categoryService.updateCategory(
        id as string,
        { name }
    );

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Category updated successfully",
        data: result
    });

});

const deleteCategory = catchAsync(async (req, res) => {

    const { id } = req.params;

    await categoryService.deleteCategory(id as string);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Category deleted successfully",
        data: null
    });

});


export const categoryController = {
    getAllCategories,
    updateCategory,
    createCategory,
    deleteCategory
}
