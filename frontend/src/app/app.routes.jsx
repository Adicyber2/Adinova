import {createBrowserRouter, Navigate} from 'react-router'
import Register from '../features/auth/pages/Register'
import Login from '../features/auth/pages/Login'
import Dashboard from '../features/chat/pages/Dashboard'
import Protected from '../features/auth/components/protected'


export const router=createBrowserRouter([
    {
        path:"/login",
        element:<Login/>
    },
    {
        path:"/register",
        element:<Register/>
    },
    {
        path:"/",
        element:<Protected><Dashboard/></Protected>
    },
    {
        path:"/dashboard",
        element:<Navigate to="/" replace/>
    }

])