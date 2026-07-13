// ---------------------------------------------------------------------------
// Error taxonomy — lets callers/logging distinguish "expected" failures
// (bad input, rate limits, timeouts) from real bugs, without string-matching
// error messages all over the place.
// ---------------------------------------------------------------------------

class ChatServiceError extends Error {
  constructor(message, { code, isOperational = true, cause } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    if (cause) this.cause = cause;
  }
}

export class ValidationError extends ChatServiceError {
  constructor(message) {
    super(message, { code: "VALIDATION_ERROR" });
  }
}

export class RetrievalError extends ChatServiceError {
  constructor(message, cause) {
    super(message, { code: "RETRIEVAL_ERROR", cause });
  }
}

export class ModelError extends ChatServiceError {
  constructor(message, { code, cause } = {}) {
    super(message, { code: code ?? "MODEL_ERROR", cause });
  }
}

export class TimeoutError extends ChatServiceError {
  constructor(message) {
    super(message, { code: "TIMEOUT" });
  }
}
