import { api, apiURL } from "../../features/utils";
import { useEffect } from "react";
import { useParams, useSearchParams, redirect, useNavigate } from "react-router-dom"

export const LoginCallback = ( ) =>  {
    const [searchParamas,setParams] = useSearchParams();
    const navigate = useNavigate()
    useEffect(() => {
        api.get(`/login/google/callback?${searchParamas.toString()}`).then(() => navigate("/admin")).catch(() => console.log("Login failed"))
    });
    return (<>
    <h2>Logging you in, please wait</h2>
    <a href={`${apiURL}/login/google`}>login</a>
    </>)
}