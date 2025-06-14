import { deleteSessions } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SESSIONS } from "./useSessions";
import { Session } from "@/types";


const useDeleteSession = (sessionId: string) => {
  const queryClient = useQueryClient();
  const {mutate, ...rest} = useMutation({
    mutationFn: () => deleteSessions(sessionId),
    onSuccess: () =>{
      // queryClient.invalidateQueries([SESSIONS])
      queryClient.setQueryData(
        [SESSIONS],
         (cache: Session[] | undefined) => cache?.filter((session) => session._id !== sessionId)
      )
    }
  })

  return {deleteSession: mutate, ...rest}

}

export default useDeleteSession;