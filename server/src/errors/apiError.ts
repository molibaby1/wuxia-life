export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'STALE_SLOT_VERSION'
  | 'STALE_SNAPSHOT'
  | 'SLOT_OVERWRITE_REQUIRED'
  | 'CATALOG_NOT_FOUND'
  | 'CATALOG_VERSION_UNSUPPORTED'
  | 'SNAPSHOT_SCHEMA_UNSUPPORTED'
  | 'ENGINE_VERSION_UNSUPPORTED'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function validationError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(422, 'VALIDATION_ERROR', message, details);
}

export function unauthorized(message = 'Invalid or missing token'): ApiError {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function conflict(
  code: 'STALE_SLOT_VERSION' | 'STALE_SNAPSHOT' | 'SLOT_OVERWRITE_REQUIRED',
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError(409, code, message, details);
}
