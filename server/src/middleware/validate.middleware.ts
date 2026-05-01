import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../shared/errors/AppError";

// this midleware takes a Zod schema and validates the reqest body against it
// if validation fails, it converts Zod's error format into our custome
// ValidationError format and passes it to the error handler
//
// usage in routes: router.post("/", validate(createTaskSchema), controller.create)
// preety clean right? no validation logic leaking into the contollers

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // parse the reqest body — Zod will throw if validation fails
      // using parse() instead of safeParse() becuase we want the throw
      const validated = schema.parse(req.body);

      // replace req.body with the parsed/transformd data
      // this means controllers always get clean, typed data
      // (Zod also strips unknown feilds which is nice for security)
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // convert Zod's error format into somthing more frontend-friendly
        // Zod gives us an array of issues, we group them by feild name
        const formattedErrors: Record<string, string[]> = {};

        error.errors.forEach((err) => {
          // the path array tells us wich field faild
          // e.g., ["address", "zipCode"] becomes "address.zipCode"
          const field = err.path.join(".") || "body";

          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(err.message);
        });

        next(new ValidationError(formattedErrors));
      } else {
        // if its not a ZodError, somthing weird happened
        // just pass it along to the genral error handler
        next(error);
      }
    }
  };
};

// validates query paramters instead of body
// usefull for list endpoints with pagination/filter params
// same idea as above but reads from req.query insted
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      // overrite the query object with parsed values
      // this coerces string query params into proper types (numbers, booleans etc)
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".") || "query";
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(err.message);
        });
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
