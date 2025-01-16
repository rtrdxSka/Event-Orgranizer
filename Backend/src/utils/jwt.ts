import { SignOptions } from "jsonwebtoken";
import { SessionDocument } from "../models/session.model";
import { UserDocument } from "../models/user.model";
import { JWT_SECRET } from "../constants/env";
import jwt from "jsonwebtoken";


export type RefreshTokenPayload = {
  sessionId: SessionDocument["_id"];
}

export type AccessTokenPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"]; 
}
type SignOptionsAndSecret = SignOptions & {
  secret: string;
}

const defaults: SignOptions = {
  audience: ["user"],
}

const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "15m",
  secret: JWT_SECRET
}

export const refreshTokenSignOptions: SignOptionsAndSecret = { 
  expiresIn: "30d",
  secret: JWT_SECRET
}


export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptionsAndSecret
) => {
  const {secret, ...signOpts} = options || accessTokenSignOptions;

  return jwt.sign(payload, secret, {...defaults,...signOpts});
}