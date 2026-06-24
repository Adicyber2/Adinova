import { useDispatch } from "react-redux";
import {register,login,getMe} from "../services/auth.api"
import {setUser,setLoading,setError} from "../auth.slice"

export function useAuth(){

    const dispatch = useDispatch()

    async function handleRegister({email,username,password}){
        try{
            dispatch(setLoading(true))
            const data = await register({email,username,password})
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Registration failed"))
        }finally{
            dispatch(setLoading (false ))
        }
    }



    async function handleLogin({email,password}){
        try{
            dispatch(setLoading(true))
            const data = await login({email,password})
            dispatch(setUser(data.user))
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Login Failed"))

        }finally{
            dispatch(setLoading(false))
        }
    }


    async function handlegetMe(){
        try{
            dispatch(setLoading(true))
            const data=await getMe()
            dispatch(setUser(data.user))
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Faild to featch user data"))

        }finally{
            dispatch(setLoading(false))
        }
    }

    return {
        handleLogin,
        handleRegister,
        handlegetMe
    }

}