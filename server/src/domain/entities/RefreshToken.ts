// domain/entities/RefreshToken.ts
export class RefreshToken {
  constructor(
    public readonly id: number | undefined,
    public readonly user_id: number,
    public token: string,
  ) {}

  updateToken(newToken: string): void {
    this.token = newToken;
  }

  static create(user_id: number, token: string): RefreshToken {
    return new RefreshToken(undefined, user_id, token);
  }
}
