import { Button } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { api } from "../utils";
import { logOut } from "./loginSlice";
import { useTranslation } from "react-i18next";

export const LoginBtn = () => {
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  // const username = useAppSelector((state) => state.login.username);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logout = () => {
    api.get("/logout").then(() => {
      dispatch(logOut());
      navigate("/");
    });
  };
  return loggedIn ? (
    <>
      <Button onClick={() => logout()}>{t("login.logout")}</Button>
    </>
  ) : (
    <>
      <Button onClick={() => navigate("/login")}>{t("login.login")}</Button>
    </>
  );
};
