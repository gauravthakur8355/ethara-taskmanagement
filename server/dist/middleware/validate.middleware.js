"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../shared/errors/AppError");
// this midleware takes a Zod schema and validates the reqest body against it
// if validation fails, it converts Zod's error format into our custome
// ValidationError format and passes it to the error handler
//
// usage in routes: router.post("/", validate(createTaskSchema), controller.create)
// preety clean right? no validation logic leaking into the contollers
const validate = (schema) => {
    return (req, _res, next) => {
        try {
            // parse the reqest body — Zod will throw if validation fails
            // using parse() instead of safeParse() becuase we want the throw
            const validated = schema.parse(req.body);
            // replace req.body with the parsed/transformd data
            // this means controllers always get clean, typed data
            // (Zod also strips unknown feilds which is nice for security)
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // convert Zod's error format into somthing more frontend-friendly
                // Zod gives us an array of issues, we group them by feild name
                const formattedErrors = {};
                error.errors.forEach((err) => {
                    // the path array tells us wich field faild
                    // e.g., ["address", "zipCode"] becomes "address.zipCode"
                    const field = err.path.join(".") || "body";
                    if (!formattedErrors[field]) {
                        formattedErrors[field] = [];
                    }
                    formattedErrors[field].push(err.message);
                });
                next(new AppError_1.ValidationError(formattedErrors));
            }
            else {
                // if its not a ZodError, somthing weird happened
                // just pass it along to the genral error handler
                next(error);
            }
        }
    };
};
exports.validate = validate;
// validates query paramters instead of body
// usefull for list endpoints with pagination/filter params
// same idea as above but reads from req.query insted
const validateQuery = (schema) => {
    return (req, _res, next) => {
        try {
            const validated = schema.parse(req.query);
            // overrite the query object with parsed values
            // this coerces string query params into proper types (numbers, booleans etc)
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = {};
                error.errors.forEach((err) => {
                    const field = err.path.join(".") || "query";
                    if (!formattedErrors[field]) {
                        formattedErrors[field] = [];
                    }
                    formattedErrors[field].push(err.message);
                });
                next(new AppError_1.ValidationError(formattedErrors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validate.middleware.js.map