"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = exports.sendError = exports.sendSuccess = void 0;
// wraper for succesful responses — keeps things DRY across all controllers
// im kinda proud of this one ngl
const sendSuccess = (res, data, message = "Success", statusCode = 200, meta) => {
    const responseBody = {
        success: true,
        message,
        data,
        ...(meta && { meta }), // only incldue meta if it actualy exists
    };
    return res.status(statusCode).json(responseBody);
};
exports.sendSuccess = sendSuccess;
// wraper for error responses — the error midleware calls this
// but you can also use it directly if you need too
const sendError = (res, message, statusCode = 500, code = "INTERNAL_ERROR", errors) => {
    const responseBody = {
        success: false,
        message,
        code,
        ...(errors && { errors }), // validaiton errors go here
    };
    return res.status(statusCode).json(responseBody);
};
exports.sendError = sendError;
// pagination helper becuase literally every list endpoint needs this
// and i was tired of calculating offsets manualy every single time
const buildPaginationMeta = (page, limit, totalCount) => {
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
exports.buildPaginationMeta = buildPaginationMeta;
//# sourceMappingURL=response.js.map