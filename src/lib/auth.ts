import {jwtDecode} from "jwt-decode";
import { useAuthStore } from "@/store/auth-store";

export const checkAuthOnLoad = () => {
  const authData = localStorage.getItem("auth-store");
  if (authData) {
    const { state } = JSON.parse(authData);
    if (state.token) {
      const decoded: any = jwtDecode(state.token);
      if (decoded.exp * 1000 < Date.now()) {
        useAuthStore.getState().logout(); // Token expired
      } else {
        useAuthStore.setState({
          isAuthenticated: true,
          token: state.token,
          user: state.user,

        });
      }
    }
  }
};
