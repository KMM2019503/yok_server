export class ApiResponse {
  static success<T>(payload: T) {
    return payload;
  }

  static error(message: string, extra?: Record<string, unknown>) {
    return {
      error: message,
      ...(extra ?? {}),
    };
  }
}
