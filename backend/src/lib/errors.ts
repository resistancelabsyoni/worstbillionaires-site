/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Tournament error (e.g., no votes found for matchup)
 */
export class TournamentError extends AppError {
  constructor(message: string) {
    super(message, 500, 'TOURNAMENT_ERROR');
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Authentication error (401 Unauthorized)
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
  }
}

/**
 * Forbidden error (403 Forbidden)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}
