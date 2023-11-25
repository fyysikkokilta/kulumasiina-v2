import { useAppDispatch } from "../../app/hooks";
import { api } from "../utils";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { logIn } from "./loginSlice";

export const LoginCallback = () => {
  const [searchParamas, _setParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(() => {
    api
      .get(`/login/google/callback?${searchParamas.toString()}`)
      .then((res) => {
        dispatch(logIn(res.data.username));
        navigate("/admin");
      })
      .catch(() => navigate("/login"));
  });
  return (
    <>
      <h2>Logging you in, please wait</h2>
    </>
  );
};
