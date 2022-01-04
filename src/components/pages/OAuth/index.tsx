import LoadingPage from "@/components/@molecules/LoadingPage";
import { QUERY } from "@/constants/api";
import { useUserContext } from "@/hooks/contexts/useUserContext";
import { axiosBearerOption } from "@/utils/customAxios";
import { setLocalStorage } from "@/utils/localStorage";
import { request } from "@/utils/request";
import { useEffect } from "react";
import { useLocation, useParams } from "react-router";

const OAuth = () => {
  const location = useLocation();
  const { provider } = useParams<{ provider: string }>();
  const urlSearchParams = new URLSearchParams(location.search);
  const code = urlSearchParams.get("code");
  const { refetchUser, user } = useUserContext();

  useEffect(() => {
    if (!code) {
      window.close();
    }

    const setAccessTokenAsync = async () => {
      try {
        const response = await request.post(QUERY.LOGIN, {
          oauthProviderName: provider,
          authorizationCode: code
        });

        const { accessToken, refreshToken } = response.data;

        axiosBearerOption.clear();
        axiosBearerOption.setAccessToken(accessToken);

        setLocalStorage("refreshToken", refreshToken);
        setLocalStorage("active", true);

        refetchUser();
      } catch (error) {
        console.error(error);
      }
    };

    setAccessTokenAsync();
  }, [code]);

  useEffect(() => {
    if (!user) return;

    window.close();
  }, [user]);

  useEffect(() => {
    const timeId = setTimeout(() => {
      alert("로그인에 실패하였습니다. 잠시후 다시 시도해주세요.");
      window.close();
    }, 5000);

    return () => {
      clearTimeout(timeId);
    };
  }, []);

  return <LoadingPage />;
};

export default OAuth;
