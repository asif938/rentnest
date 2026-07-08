import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IPropertyQuery } from "./property.interface";
import httpStatus from 'http-status';

const createProperty = async (
    landlordId: string,
    payload: {
        title: string;
        description: string;
        price: number;
        location: string;
        amenities: string[];
        categoryId: string;
    }
) => {

    const category = await prisma.category.findUnique({
        where: {
            id: payload.categoryId
        }
    });

    if (!category) {
        throw new AppError(404, "Category not found");
    }

    const property = await prisma.property.create({
        data: {
            ...payload,
            landlordId
        },
        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return property;

}


const getAllProperties = async (query: IPropertyQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
        isAvailable: true
    };


    if (query.location) {
        where.location = {
            contains: query.location,
            mode: "insensitive"
        };
    }

    if (query.category) {
        where.category = {
            name: {
                equals: query.category,
                mode: "insensitive"
            }
        };
    }


    if (query.minPrice || query.maxPrice) {

        where.price = {};

        if (query.minPrice) {
            where.price.gte = Number(query.minPrice);
        }

        if (query.maxPrice) {
            where.price.lte = Number(query.maxPrice);
        }

    }

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const total = await prisma.property.count({
        where
    });

    const properties = await prisma.property.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
            [sortBy]: sortOrder
        },

        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }

    });

    return {

        meta: {
            page,
            limit,
            total
        },

        data: properties

    };

};

const getSingleProperty = async (id: string) => {

    const property = await prisma.property.findUnique({

        where: {
            id
        },

        include: {

            category: true,

            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            },

            reviews: {
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            }

        }

    });

    if (!property) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Property not found"
        );
    }

    return property;

};

const updateProperty = async (
  propertyId: string,
  landlordId: string,
  payload: {
    title?: string;
    description?: string;
    price?: number;
    location?: string;
    amenities?: string[];
    images?: string[];
    categoryId?: string;
    isAvailable?: boolean;
  }
) => {

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Property not found"
    );
  }

  // Ownership check
  if (property.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this property"
    );
  }

  // Validate category
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: payload.categoryId,
      },
    });

    if (!category) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Category not found"
      );
    }
  }

  // Optional manual validation
  if (payload.price !== undefined && payload.price <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Validation Error",
      [
        {
          field: "price",
          message: "Price must be greater than 0",
        },
      ]
    );
  }

  const updatedProperty = await prisma.property.update({
    where: {
      id: propertyId,
    },

    data: payload,

    include: {
      category: true,

      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedProperty;
};


const deleteProperty = async (
  propertyId: string,
  landlordId: string
) => {

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Property not found"
    );
  }

  // Ownership check
  if (property.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this property"
    );
  }

  // Prevent deletion if rental requests exist
  const rentalRequestCount = await prisma.rentalRequest.count({
    where: {
      propertyId,
    },
  });

  if (rentalRequestCount > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete property because it has rental requests."
    );
  }

  await prisma.property.delete({
    where: {
      id: propertyId,
    },
  });
};


export const PropertyService = {
    createProperty,
    getAllProperties,
    getSingleProperty,
    updateProperty,
    deleteProperty
}