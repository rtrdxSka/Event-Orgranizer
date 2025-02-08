import API from "@/config/apiClient";
import { CreateEventInput, createEventValidationSchema } from './validations/event.schemas';

type LoginParams = {
  email: string;
  password: string;
}

type RegisterParams = {
  email: string;
  password: string;
  confirmPassword: string;
}

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
}

export const login = async (data: LoginParams) => {
  return API.post('/auth/login', data);
}

export const register = async (data: RegisterParams) => {
  return API.post('/auth/register', data);
}

export const verifyEmail = async (verificationCode: string) => {
  return API.get(`/auth/email/verify/${verificationCode}`)
}

export const sendPasswordResetEmail = async (email: string) => {
  return API.post('/auth/password/forgot', { email });
}

export const resetPassword = async ({verificationCode, password}:ResetPasswordParams) => {
  return API.post("/auth/password/reset", { verificationCode, password });  
}

export const getUser = async () => {
  return API.get("/user");
};

export const logout = async () => {
  return API.get("/auth/logout");
}

export const getSessions = async () => {
  return API.get("/sessions");
}

export const deleteSessions = async (id:string) => {
  API.delete(`/sessions/${id}`);
}


// api/event.ts
export const createEvent = async (data: CreateEventInput) => {
  // Validate the data
  const validatedData = createEventValidationSchema.parse(data);
  
  // Prepare the data for API
  const apiData = {
    ...validatedData,
    eventDate: validatedData.eventDate ? new Date(validatedData.eventDate).toISOString() : undefined,
  };
  
  // Make the API call
  const response = await API.post('/event/create', apiData);
  
  // Return the data directly as it comes from the API
  return response;
};