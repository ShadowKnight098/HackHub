import { ErrorCode } from './enums';
export { ErrorCode };

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: unknown;
  public readonly friendlyMessage: string;

  constructor(code: ErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.friendlyMessage = this.deriveFriendlyMessage(code, message);

    // Maintain proper stack trace in V8
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, AppError);
    }
  }

  private deriveFriendlyMessage(code: ErrorCode, fallback: string): string {
    switch (code) {
      case ErrorCode.PERMISSION_DENIED:
        return "You don't have permission to access this resource.";
      case ErrorCode.NOT_FOUND:
        return 'The requested item could not be found.';
      case ErrorCode.NETWORK:
        return 'A network error occurred. Please check your connection and try again.';
      case ErrorCode.SESSION_EXPIRED:
        return 'Your session has expired. Please sign in again.';
      case ErrorCode.VALIDATION:
        return fallback || 'Invalid input provided. Please verify and try again.';
      case ErrorCode.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toAppError(err: unknown): AppError {
  if (isAppError(err)) {
    return err;
  }
  if (err instanceof Error) {
    // Check common supabase or fetch error patterns
    const msg = err.message.toLowerCase();
    if (msg.includes('jwt expired') || msg.includes('token expired') || msg.includes('auth session missing')) {
      return new AppError(ErrorCode.SESSION_EXPIRED, err.message, err);
    }
    if (msg.includes('permission denied') || msg.includes('policy') || msg.includes('unauthorized')) {
      return new AppError(ErrorCode.PERMISSION_DENIED, err.message, err);
    }
    if (msg.includes('network') || msg.includes('fetch failed')) {
      return new AppError(ErrorCode.NETWORK, err.message, err);
    }
    return new AppError(ErrorCode.UNKNOWN, err.message, err);
  }
  return new AppError(ErrorCode.UNKNOWN, 'Unknown error', err);
}
