export function invariant<T = unknown>(condition: T, message: string) {
  if (!Boolean(condition)) {
    throw new Error(message);
  }
}
