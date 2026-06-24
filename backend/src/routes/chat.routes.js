import { Router } from 'express';
import { sendmessage ,getChats,getMessage,deleteChat} from "../controllers/chat.controller.js";
import { authUser } from '../middlewares/auth.middelware.js';
const chatRouter=Router()

chatRouter.post("/message",authUser,sendmessage)

chatRouter.get("/",authUser,getChats)

chatRouter.get("/:chatId/messages",authUser,getMessage)

chatRouter.delete("/delete/:chatId",authUser,deleteChat)

export default chatRouter


