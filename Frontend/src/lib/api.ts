import API from "@/config/apiClient";
import { CreateEventPayload, EventResponse, User, EventGet, EventResponsePayload, UserEventResponse, EventOwnerResponse, FinalizeEventResponse, FinalizedEventData, RemoveOptionResponse } from "@/types";

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
export const submitEventResponse = async (responseData: EventResponsePayload) => {
  const response = await API.post('/event/response', responseData);
  return response;
};

export const updateEventResponse = async (eventId: string, responseData: EventResponsePayload) => {
  const response = await API.put(`/event/response/${eventId}`, responseData);
  return response;
};


export const getUserEventResponse = async (eventId: string): Promise<{
  data: UserEventResponse;
}> => {
  const response = await API.get(`/event/${eventId}/response`);
  return response;
};

export const getOtherUserSuggestions = async (
  eventId: string,
  options?: {
    page?: number;
    limit?: number;
    maxSuggestions?: number;
  }
) => {
  const params = new URLSearchParams();
  
  if (options?.page !== undefined) {
    params.append('page', options.page.toString());
  }
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options?.maxSuggestions) {
    params.append('maxSuggestions', options.maxSuggestions.toString());
  }
  
  const url = `/event/${eventId}/other-responses${params.toString() ? `?${params}` : ''}`;
  const response = await API.get(url);
  return response;
};

// Get events created by current user
export const getUserCreatedEvents = async (): Promise<EventGet[]> => {
  const response = await API.get('/event/created');
  return response.data;
};

// Get events user has responded to
export const getUserRespondedEvents = async (): Promise<EventGet[]> => {
  const response = await API.get('/event/responded');
  return response.data;
};


export const getEventForOwner = async (eventId: string): Promise<EventOwnerResponse> => {
  const response = await API.get(`/event/${eventId}/edit`);
  return response.data;
};

// Event status management functions
export const closeEvent = async (eventId: string) => {
  const response = await API.patch(`/event/${eventId}/close`);
  return response;
};

export const reopenEvent = async (eventId: string) => {
  const response = await API.patch(`/event/${eventId}/reopen`);
  return response;
};

export const finalizeEvent = async (eventId: string, selectionData: {
  date: string | null;
  place: string | null;
  customFields: Record<string, string | string[] | number | boolean>;
}): Promise<FinalizeEventResponse> => {
  return API.post(`/event/${eventId}/finalize`, selectionData);
};

export const getFinalizedEvent = async (eventUUID: string): Promise<FinalizedEventData> => {
  const response = await API.get(`/event/finalized/${eventUUID}`);
  return response.data;
};

export const removeEventOption = async (
  eventId: string, 
  categoryName: string, 
  optionName: string, 
  fieldId?: string
): Promise<RemoveOptionResponse> => {
  return API.delete(`/event/${eventId}/option`, {
    data: {
      categoryName,
      optionName,
      fieldId
    }
  });
};