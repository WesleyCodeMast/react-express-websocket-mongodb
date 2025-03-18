import { useContext } from "react"
import { emailValidate } from "../../../backend/Controllers/Advisor/Auth.Controller"
import { useLocalStorage } from "./useLocalStorage";

export const authUser = {
    id: string,
    name: string,
    email: string,
    authToken: string   
}

export const useUser = () => {
    
    const {user, setUser} = useContext(AuthContext);
    const {setItem} = useLocalStorage();
    
}