import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { PropertyService } from "./property.service";
import { IIdParams } from "./property.interface";

const createProperty = catchAsync(async (req: Request, res: Response) => {

    const {
        title,
        description,
        price,
        location,
        amenities,
        categoryId
    } = req.body;

    // Manual validation

    if (!title || title.trim() === "") {
        throw new AppError(400, "Validation Error", [
            {
                field: "title",
                message: "Title is required"
            }
        ]);
    }

    if (!description || description.trim() === "") {
        throw new AppError(400, "Validation Error", [
            {
                field: "description",
                message: "Description is required"
            }
        ]);
    }

    if (price === undefined || price <= 0) {
        throw new AppError(400, "Validation Error", [
            {
                field: "price",
                message: "Price must be greater than 0"
            }
        ]);
    }

    if (!location || location.trim() === "") {
        throw new AppError(400, "Validation Error", [
            {
                field: "location",
                message: "Location is required"
            }
        ]);
    }

    if (!Array.isArray(amenities)) {
        throw new AppError(400, "Validation Error", [
            {
                field: "amenities",
                message: "Amenities must be an array"
            }
        ]);
    }

    if (!categoryId) {
        throw new AppError(400, "Validation Error", [
            {
                field: "categoryId",
                message: "Category is required"
            }
        ]);
    }

    const result = await PropertyService.createProperty(
        req.user!.id,
        {
            title,
            description,
            price,
            location,
            amenities,
            categoryId
        }
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Property created successfully",
        data: result
    });

});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {

    const result = await PropertyService.getAllProperties(req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Properties retrieved successfully",
        data: result.data,
        meta: result.meta
    });

});

const getSingleProperty = catchAsync(async (req: Request, res: Response) => {

    const id = req.params.id as string;

    if (!id || id.trim() === "") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Validation Error",
            [
                {
                    field: "id",
                    message: "Property id is required"
                }
            ]
        );
    }

    const result = await PropertyService.getSingleProperty(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property retrieved successfully",
        data: result
    });

});

const updateProperty = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id as string;

        if (!id.trim()) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Validation Error",
                [
                    {
                        field: "id",
                        message: "Property id is required",
                    },
                ]
            );
        }

        const result = await PropertyService.updateProperty(
            id,
            req.user!.id,
            req.body
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Property updated successfully",
            data: result,
        });
    }
);

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id.trim()) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Validation Error",
            [
                {
                    field: "id",
                    message: "Property id is required",
                },
            ]
        );
    }

    await PropertyService.deleteProperty(id, req.user!.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property deleted successfully",
        data: null,
    });
});



export const PropertyController = {
    createProperty,
    getAllProperties,
    getSingleProperty,
    updateProperty,
    deleteProperty
};