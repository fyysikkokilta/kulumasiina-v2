import { Button } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { api } from "../utils";
import { logOut } from "./loginSlice";

export const LoginBtn = () => {
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  // const username = useAppSelector((state) => state.login.username);
  const navigate = useNavigate();
  const logout = () => {
    api.get("/logout").then(() => {
      dispatch(logOut());
      navigate("/");
    });
  };
  return loggedIn ? (
    <>
      <Button onClick={() => logout()}>Log out</Button>
    </>
  ) : (
    <>
      <Button onClick={() => navigate("/login")}>Log in</Button>
    </>
  );
};
