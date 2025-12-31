import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  TournamentError,
  RateLimitError,
  AuthError,
  ForbiddenError,
} from './errors';

describe('Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 500, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('AppError');
  });

  it('should create ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create TournamentError with 500 status', () => {
    const error = new TournamentError('No votes found');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TOURNAMENT_ERROR');
  });

  it('should create RateLimitError with 429 status', () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_ERROR');
  });

  it('should create AuthError with 401 status', () => {
    const error = new AuthError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTH_ERROR');
  });

  it('should create ForbiddenError with 403 status', () => {
    const error = new ForbiddenError('Voting closed');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN_ERROR');
  });
});
