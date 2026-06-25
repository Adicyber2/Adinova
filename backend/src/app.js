import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter  from './routes/auth.routes.js'
import chatRouter from "./routes/chat.routes.js"
import cors from 'cors'
import morgan from 'morgan'
const app=express()

app.use(express.static("./public"))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(morgan("dev"))
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ exact frontend origin
    credentials: true,    
    methods:["GET","POST","PUT","DELETE"],
              // ✅ allow cookies
  })
);

app.get("/",(req,res)=>{
    res.json({message:"server is running"})
})

app.use("/api/auth",authRouter)

app.use("/api/chats",chatRouter)

export default app