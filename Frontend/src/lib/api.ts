import API from "@/config/apiClient";
import { CreateEventPayload, EventResponse, User, EventGet, EventResponsePayload, EventResponseSuccess } from "@/types";

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

export const getUser = async (): Promise<User> => {
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
// /event/create
export const createEvent = async (eventData: CreateEventPayload): Promise<EventResponse> => {
  return API.post('/event/create', eventData);
};


export const getEvent = async (eventUUID: string): Promise<EventGet> => {
  return API.get(`/event/submit/${eventUUID}`);
}


// Submit event response
export const submitEventResponse = async (responseData: EventResponsePayload): Promise<EventResponseSuccess> => {
  const response = await API.post('/event/response', responseData);
  return response;
};

// Get user's previous response to this event (if any)
export const getUserEventResponse = async (eventId: string) => {
  const response = await API.get(`/event/${eventId}/response`);
  return response;
};