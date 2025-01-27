import mongoose from "mongoose";
import VerificationCodeType from "../constants/verificationCodeTypes";


export interface verificationCodeDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: VerificationCodeType;
  expiresAt: Date;
  createdAt: Date;
};

const verificationCodeSchema = new mongoose.Schema<verificationCodeDocument>({
  userId: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true, index:true},
  type: {type: String, required: true},
  createdAt: {type: Date, default: Date.now, required: true},
  expiresAt: {type: Date, required: true}
});

const VerificationCodeModel = mongoose.model<verificationCodeDocument>(
  "VerificationCode", 
  verificationCodeSchema,
  "verification_codes"
);

export default VerificationCodeModel;