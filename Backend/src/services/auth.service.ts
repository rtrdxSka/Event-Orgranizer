import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;  
}

export const createAccount = async(data: CreateAccountParams) => {
  //verify existing user does not exist
  const existingUser = await UserModel.exists({
    email: data.email
  });
  appAssert(
    !existingUser,
    CONFLICT,
    "Email already in use"
  );
  //create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password
  });
  const userId = user._id;
  //create verification code
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow()
  });
  //send verification email

  // create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent
  })
  //sing access token and refresh token
  const refreshToken = signToken({
    sessionId: session._id
  },refreshTokenSignOptions)

  const accessToken = signToken({
    userId,
    sessionId: session._id
  })
  //return user and tokens
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken
  }

};

export type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;  
}

export const loginUser = async ({email,password,userAgent}: LoginParams) => {
  // get the user by email
  const user = await UserModel.findOne({email});
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  // validate the password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  // create a session
  const session = await SessionModel.create({
    userId,
    userAgent
  });

  const sessionInfo = {
    sessionId: session._id
  }

  //sign access token & refresh token
  const refreshToken = signToken(sessionInfo,refreshTokenSignOptions)

  const accessToken = signToken({
    ...sessionInfo,
    userId
  })


  //return user and tokens
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken
  }
}