import { getUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const AUTH = "auth";

const useAuth = (opts = {}) => {
  const { data: user, ...rest } = useQuery({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: 0,
    refetchOnMount: true,
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