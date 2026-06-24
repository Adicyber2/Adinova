import userModel from '../models/user.model.js'
import jwt from 'jsonwebtoken'

import { sendEmail } from '../services/mail.service.js'

export async function register(req, res) {
    // request body has already been validated by express-validator
    const { username, email, password } = req.body

    try {
        // ensure email is unique
        const existing = await userModel.findOne({
            $or:[{
                username
            },{
                email
            }]
         })
        if (existing) {
            return res.status(400).json({ message: 'Username or Email already in use',success:false,err:"user already exists"
            })
        }

    
        const user = await userModel.create ({ username, email, password })
        const token=jwt.sign({
            email:user.email
        },process.env.JWT_SECRET,{expiresIn:"1d"})
        res.cookie("token",token)

        await sendEmail({
            to:email,
            subject:"Welcom to perplexity",
            html:`<p>Hi ${username},</p>
                 <p>Thank you for registering at perplexity! we're excited to have you on board. If you have any question or need assistance, feel free to reach out to our support team.</p>
                 <p>Please verify your email address by clicking the Link below:</p>
                 <a href="http://localhost:3000/api/auth/verify-email?token=${token}">Verify Email</a>
                <p>If you did not create an account, no further action is required.</p>
                <p>Best regards,<br>The perplexity Team</p>`
        })

        
        return res.status(201).json({ user })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Server error' })
    }
}


export async function Login(req,res)
{
    const {email,password}=req.body
    const user=await userModel.findOne({email})
    
    if(!user){
        return res.status(400).json({
            message:"Invalid email or password",
            success:false,
            err:"User not found"
        })
    }

    const isPasswordValid=await user.comparePassword(password)
    if(!isPasswordValid){
        return res.status(400).json({
            message:"Inavlid email or password",
            success:false,
            err:"Incorrect password"
        })
    }

    if(!user.verified){
        return res.status(400).json({
            message:"please verify your email before logging in",
            success:false,
            err:"Email no verified"
        })
    }

    const token=jwt.sign({id:user._id,
        usename:user.username
    },process.env.JWT_SECRET,{expiresIn:"7d"})
    res.cookie("token",token)

    res.status(200).json({
        message:"Login successful",
        success:true,
        user:{
            username:user.username,
            id:user._id,
            email:user.email
        }
    })
}


export async function getMe(req,res){
    const userId=req.user.id

    const user=await userModel.findById(userId).select("-password")
    if(!user){
        return res.status(404).json({
            message:"User not found",
            success:false,
            err:"user not found"
        })
    }
    res.status(200).json({
        message:"user festached successfully",
        success:true,
        user
    })

}


export async function verifyEmail(req,res){
    
    const {token}=req.query

    try{

    

    const decoded=jwt.verify(token,process.env.JWT_SECRET)

    const user = await userModel.findOne({email:decoded.email})

    if(!user){
        return res.status(400).json({
            message:"Invalid token",
            success:false,
            err:"user not found"
        })
    }

    user.verified=true
    await user.save()

    const html=`<h1>Email verifyed successfully</h1>
        <p>Thank you for verifying your email address. you can now log in to your account and start using our services.</p>
        <a href="http:localhost:3000/login">Go to Login</a>`

        return res.send(html)
    }catch(err){
        return res.status(400).json({
            message:"Invalid or expired token ",
            success:false,
            err:err.message
        })
    }
   
}