import API from "@/config/apiClient";

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