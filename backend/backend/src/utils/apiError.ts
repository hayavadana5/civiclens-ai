export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, message, details);

export const notFound = (message: string) => new ApiError(404, message);

export const serverError = (message: string, details?: unknown) =>
  new ApiError(500, message, details);
