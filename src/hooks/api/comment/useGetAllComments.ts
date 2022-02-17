import { useUserContext } from "@/hooks/contexts/useUserContext";
import { Comment, GetCommentsRequestParams, GetCommentsResponse } from "@/types/comment";
import { getAllComments } from "@/utils/api";
import { deepObjectEqual } from "@/utils/deepEqual";
import { removeLocalStorage } from "@/utils/localStorage";
import { useEffect } from "react";
import { useQuery } from "simple-react-query";

const compareComments = (prevComments: GetCommentsResponse, currComments: GetCommentsResponse) => {
  if (!prevComments) return false;

  return deepObjectEqual(prevComments, currComments);
};

export const useGetAllComments = ({ url, projectSecretKey, sortOption = "oldest" }: GetCommentsRequestParams) => {
  const { user, accessToken, isLoadingUserRequest } = useUserContext();

  const { data, isLoading, refetch, error, setData, isFetched } = useQuery<GetCommentsResponse>({
    enabled: false,
    query: () => getAllComments({ url, projectSecretKey, sortOption }),
    isEqualToPrevDataFunc: compareComments
  });

  useEffect(() => {
    refetch();
  }, [isLoadingUserRequest, user, accessToken]);

  useEffect(() => {
    if (error) {
      removeLocalStorage("accessToken");
      refetch();
    }
  }, [error]);

  const totalCommentsCount = data?.totalComment || 0;
  const totalPage = data?.totalPage || 0;
  const comments = data?.comments || [];

  const setComments = (comments: Comment[]) => setData({ totalComment: totalCommentsCount, totalPage, comments });

  return { totalCommentsCount, totalPage, comments, isLoading, error, refetch, setComments, isFetched };
};
