declare module 'csrf' {
  export default class Tokens {
    constructor();
    secretSync(): string;
    create(secret: string): string;
    verify(secret: string, token: string): boolean;
  }
}
