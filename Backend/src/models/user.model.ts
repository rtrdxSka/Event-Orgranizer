import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string) :Promise <boolean>;
}

const userSchema = new mongoose.Schema<UserDocument>({

  email: {type: String, unique: true, required: true},
  password: {type: String, required: true},
  verified: {type: Boolean, default: false, required: true},
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
}

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;