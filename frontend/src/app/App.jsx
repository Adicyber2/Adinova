
import React, { useEffect } from 'react'
import {RouterProvider} from 'react-router-dom'
import {router} from '../app/app.routes'
import { useAuth } from '../features/auth/hook/useAuth'

const App = () => {

  const auth=useAuth()

  useEffect(()=>{
    auth.handlegetMe()
  },[])

  return (
   <RouterProvider router={router}/>
  )
}

export default App
