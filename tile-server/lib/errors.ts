export class EtagMismatch extends Error {}

export class KeyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}
