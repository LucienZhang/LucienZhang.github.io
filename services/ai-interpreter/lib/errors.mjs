export class ApiError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
export function requireThat(condition, code = 'INVALID_INPUT', status = 400) {
  if (!condition) throw new ApiError(code, status);
}
export function exactKeys(value, keys) {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value));
  requireThat(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)));
}
