import { Router } from "express";
import { register ,verifyEmail,Login,getMe} from '../controllers/auth.controller.js';
import { registerValidator ,loginValidator} from '../validators/auth.validator.js';
import { authUser } from "../middlewares/auth.middelware.js";


const authRouter = Router();

// registration endpoint with validation chain and result check middleware
authRouter.post(
  "/register",
  registerValidator,
  register
);

authRouter.post("/login",
  loginValidator,
  Login)

authRouter.get("/get-me",authUser,getMe)

authRouter.get("/verify-email",verifyEmail)

export default authRouter