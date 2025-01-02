// BaseError class that other custom errors will extend
class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ValidationError for validation-related issues
export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

// NetworkError for network-related issues
export class NetworkError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

// ReservationError for reservation-specific issues
export class ReservationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}
