import { getUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { User} from '@/types';
export const AUTH = "auth";

interface AuthOptions {
  enabled?: boolean;
}

const useAuth = (opts: AuthOptions = {}) => {
  const { data: user, ...rest } = useQuery<User, Error>({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    retry: false,
    enabled: opts.enabled !== false, // Allow disabling the query
    ...opts
  });


  return {
    user,
    isAuthenticated: !!user,
    ...rest
  };
};

export default useAuth;