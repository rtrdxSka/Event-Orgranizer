import axios, { AxiosResponse } from 'axios';
import queryClient from './queryClient';
import { navigate } from '@/lib/navigation';

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

const API = axios.create(options);

interface APIError {
  response: {
    status: number;
    data: {
      errorCode?: string;
      [key: string]: any;
    };
  };
  config: any;
}

// Add a flag to track token validity
let isTokenValid = true;

API.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: APIError) => {
    const { config, response } = error;
    const { status, data } = response || {};

    if (status === 401 && data?.errorCode === "INVALID_ACCESS_TOKEN" && isTokenValid) {
      // Mark token as invalid
      isTokenValid = false;
      
      try {
        await API.get("/auth/refresh");
        // Token refreshed successfully, mark as valid again
        isTokenValid = true;
        // Retry the original request
        return API(config);
      } catch (error) {
        queryClient.clear();
        navigate("/login", {
          state: {
            redirectUrl: window.location.pathname
          }
        } as { state: { redirectUrl: string } });
      }
    }
    
    return Promise.reject({ status, ...data });
  }
);

export default API;