import { useAppDispatch } from "../../app/hooks";
import { api, apiURL } from "../../features/utils";
import { useEffect } from "react";
import { useParams, useSearchParams, redirect, useNavigate } from "react-router-dom"
import { logIn } from "./loginSlice";
import Cookie from "js-cookie";
export const LoginCallback = ( ) =>  {
    const [searchParamas,setParams] = useSearchParams();
    const navigate = useNavigate()
    const dispatch = useAppDispatch();
    useEffect(() => {
        api.get(`/login/google/callback?${searchParamas.toString()}`).then((res) => {
            dispatch(logIn(res.data.username));
            navigate("/admin");
        }).catch(() => console.log("Login failed"))
    });
    return (<>
    <h2>Logging you in, please wait</h2>
    </>)
}