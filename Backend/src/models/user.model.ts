import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  googleTokens?: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type?: string;
    scope?: string;
  };
  comparePassword(val: string) :Promise <boolean>;
  omitPassword(): Pick<UserDocument, "_id" | "email" | "verified" | "createdAt" | "updatedAt">;
}

const userSchema = new mongoose.Schema<UserDocument>({

  email: {type: String, unique: true, required: true},
  password: {type: String, required: true},
  verified: {type: Boolean, default: false, required: true},
  googleTokens: {
    type: {
      access_token: { type: String, required: true },
      refresh_token: { type: String },
      expiry_date: { type: Number },
      token_type: { type: String },
      scope: { type: String }
    },
    required: false
  }
}, {
  timestamps: true,
})

userSchema.pre("save", async function(next){

  if(!this.isModified("password")){
    return next();
  }

  this.password = await hashValue(this.password, 10);  
  next();
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;