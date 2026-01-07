export type Falsey = "" | 0 | false | null | undefined;

export function isTruthy<T>(data: T): data is Exclude<T, Falsey> {
  return Boolean(data);
}

export function isFalsey(data: unknown): data is Falsey {
  return !data;
}
