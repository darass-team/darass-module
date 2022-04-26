import CommentArea from "@/components/pages/CommentArea";
import OAuth from "@/components/pages/OAuth";
import { QUERY } from "@/constants/api";
import { ROUTE } from "@/constants/route";
import { PALETTE } from "@/constants/styles/palette";
import { useDeleteAccessToken, useRecentlyAlarmWebSocket, useUser } from "@/hooks";
import { MessageChannelFromReplyModuleContext } from "@/hooks/contexts/useMessageFromReplyModule";
import { RecentlyAlarmContentContext } from "@/hooks/contexts/useRecentlyAlarmContentContext";
import { UserContext } from "@/hooks/contexts/useUserContext";
import { AlertError } from "@/utils/alertError";
import { getLocalStorage, removeLocalStorage, setLocalStorage } from "@/utils/localStorage";
import { messageFromReplyModule } from "@/utils/postMessage";
import { request } from "@/utils/request";
import axios from "axios";
import { useEffect, useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { useReplyModuleApp } from "./useReplyModuleApp";

const getReplyModuleParams = () => {
  const urlParams = new URLSearchParams(window.location.search);

  const isDarkModePage = urlParams.get("darkMode") === undefined ? "false" : urlParams.get("darkMode");
  const primaryColor = decodeURIComponent(urlParams.get("primaryColor") || PALETTE.PRIMARY);

  const isShowSortOption = urlParams.get("isShowSortOption") === undefined ? "true" : urlParams.get("isShowSortOption");
  const isAllowSocialLogin =
    urlParams.get("isAllowSocialLogin") === undefined ? "true" : urlParams.get("isAllowSocialLogin");
  const isShowLogo = urlParams.get("isShowLogo") === undefined ? "true" : urlParams.get("isShowLogo");

  return {
    isDarkModePage: isDarkModePage === "true" ? true : false,
    primaryColor,
    isShowSortOption: isShowSortOption === "true" ? true : false,
    isAllowSocialLogin: isAllowSocialLogin === "true" ? true : false,
    isShowLogo: isShowLogo === "true" ? true : false
  };
};

const App = () => {
  const { isDarkModePage, primaryColor, isShowSortOption, isAllowSocialLogin, isShowLogo } = getReplyModuleParams();

  const { user, refetchUser, isLoading, isSuccess, setUser, error } = useUser();

  const [accessToken, setAccessToken] = useState<string | undefined>();

  const { recentlyAlarmContent, hasNewAlarmOnRealTime, setHasNewAlarmOnRealTime } = useRecentlyAlarmWebSocket(user);

  const { port, receivedMessageFromReplyModal } = useReplyModuleApp();

  const { deleteMutation, deleteError } = useDeleteAccessToken({
    onSuccess: () => {
      setUser(undefined);
      setAccessToken(undefined);
      removeLocalStorage("active");
      removeLocalStorage("accessToken");
      removeLocalStorage("refreshToken");
    }
  });

  const getAccessTokenByRefreshToken = async (refreshToken: string) => {
    try {
      const response = await request.post(QUERY.LOGIN_REFRESH, { refreshToken });

      const { accessToken } = response.data;

      setLocalStorage("accessToken", accessToken);

      return accessToken;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw new AlertError("알 수 없는 에러입니다.");
      }

      if (error.response?.data.code === 801) {
        if (getLocalStorage("refreshToken")) {
          refetchAccessToken();
        }
      }

      if (error.response?.data.code === 808) {
        if (getLocalStorage("refreshToken")) {
          refetchAccessToken();
        }
      }

      if (error.response?.data.code === 806) {
        logout();
      }

      if (error.response?.data.code === 809) {
        logout();
      }

      if (error.response?.data.code === 807) {
        logout();
      }
    }
  };

  const refetchAccessToken = async () => {
    const refreshToken = getLocalStorage("refreshToken");
    const accessToken = await getAccessTokenByRefreshToken(refreshToken);

    setAccessToken(accessToken);
  };

  const removeAccessToken = () => {
    deleteMutation();
  };

  const logout = () => {
    removeAccessToken();
  };

  useEffect(() => {
    refetchUser();
  }, [accessToken]);

  useEffect(() => {
    if (error) {
      if (error.name === "expiredAccessToken") {
        refetchAccessToken();
      } else {
        logout();
      }
    }
  }, [error]);

  useEffect(() => {
    if (!deleteError) return;

    setUser(undefined);
    setAccessToken(undefined);
    removeLocalStorage("active");
    removeLocalStorage("accessToken");
    removeLocalStorage("refreshToken");
  }, [deleteError]);

  return (
    <ThemeProvider
      theme={{
        isDarkModePage,
        primaryColor,
        uiInfo: {
          isShowSortOption,
          isAllowSocialLogin,
          isShowLogo
        }
      }}
    >
      <MessageChannelFromReplyModuleContext.Provider
        value={{
          setScrollHeight: messageFromReplyModule(port).setScrollHeight,
          openAlert: messageFromReplyModule(port).openAlert,
          openConfirmModal: messageFromReplyModule(port).openConfirmModal,
          openAlarmModal: messageFromReplyModule(port).openAlarmModal,
          openLikingUserModal: messageFromReplyModule(port).openLikingUserModal,
          receivedMessageFromReplyModal
        }}
      >
        <UserContext.Provider
          value={{
            user,
            logout,
            refetchUser,
            refetchAccessToken,
            accessToken,
            isLoadingUserRequest: isLoading,
            isSuccessUserRequest: isSuccess
          }}
        >
          <RecentlyAlarmContentContext.Provider
            value={{ recentlyAlarmContent, hasNewAlarmOnRealTime, setHasNewAlarmOnRealTime }}
          >
            <BrowserRouter>
              <Switch>
                <Route exact path={ROUTE.HOME} render={() => <CommentArea isVisible={!!port} />} />
                <Route exact path={ROUTE.OAUTH} component={OAuth} />
                <Redirect to={ROUTE.HOME} />
              </Switch>
            </BrowserRouter>
          </RecentlyAlarmContentContext.Provider>
        </UserContext.Provider>
      </MessageChannelFromReplyModuleContext.Provider>
    </ThemeProvider>
  );
};

export default App;
