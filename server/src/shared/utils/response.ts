import { Response } from "express";

// standarized API response format so the frontend always knows what to expact
// consistency is king — or queen — or whatever, just be consistant

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

// wraper for succesful responses — keeps things DRY across all controllers
// im kinda proud of this one ngl
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response => {
  const responseBody: SuccessResponse<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }), // only incldue meta if it actualy exists
  };

  return res.status(statusCode).json(responseBody);
};

// wraper for error responses — the error midleware calls this
// but you can also use it directly if you need too
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  errors?: Record<string, string[]>
): Response => {
  const responseBody: ErrorResponse = {
    success: false,
    message,
    code,
    ...(errors && { errors }), // validaiton errors go here
  };

  return res.status(statusCode).json(responseBody);
};

// pagination helper becuase literally every list endpoint needs this
// and i was tired of calculating offsets manualy every single time
export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalCount: number
): Record<string, unknown> => {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    currentPage: page,
    perPage: limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1, // obvously page 1 cant go back futher
  };
};
