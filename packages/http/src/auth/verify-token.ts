import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const APP_ID = "financial-management";

export class TokenInvalidError extends Error {
  constructor(message = "invalid or expired token") {
    super(message);
    this.name = "TokenInvalidError";
  }
}

export interface InternalJwtClaims {
  sub?: string;
  hid?: string;
  scope: string[];
}

export function createJwks(identityServiceUrl: string): JWTVerifyGetKey {
  return createRemoteJWKSet(new URL("/jwks.json", identityServiceUrl));
}

export async function verifyInternalJwt(
  token: string,
  jwks: JWTVerifyGetKey,
): Promise<InternalJwtClaims> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["EdDSA"],
      audience: APP_ID,
    });
    return {
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      hid: typeof payload.hid === "string" ? payload.hid : undefined,
      scope: Array.isArray(payload.scope) ? (payload.scope as string[]) : [],
    };
  } catch {
    throw new TokenInvalidError();
  }
}
