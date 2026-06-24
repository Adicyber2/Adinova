import { generateMessage ,generateChatTitle} from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

export async function sendmessage(req,res){
    const {message,chat:chatId}=req.body

        
    //  const result= await generateMessage(message)

     let title=null,chat=null

     if(!chatId){
        title= await generateChatTitle(message);
        chat= await chatModel.create({
        user:req.user.id,
        title
      })
     }

    const userMessage= await messageModel.create({
        chat:chatId||chat._id ,
        content:message,
        role:"user"
    })

     const messages= await messageModel.find({chat:chatId || chat._id})

     const result = await generateMessage(messages)


   const aiMessage = await messageModel.create({
    chat:chatId || chat._id,
    content: result,
    role: "ai"
})

res.status(201).json({
        title,
        chat,
        aiMessage
    })
    
}


export async function getChats(req,res){
    const user=req.user

    const chats = await chatModel.find({user:user.id})

    res.status(200).json({
        messgae:"Chats retrived successfully",
        chats
    })
}


export async function getMessage(req,res){
    const {chatId}=req.params

    const chat=await chatModel.findOne({
        _id:chatId,
        user:req.user.id
    })
    if(!chat){
        return res.status(404).json({
            message:"chat not found"
        })
    }

    const messages = await messageModel.find({
        chat:chatId
    })

    res.status(200).json({
        message:"messages restrieved successfully",
        messages
    })
}

export async function deleteChat(req,res){
    const {  chatId } = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id:chatId,
        user:req.user.id

       
        
    })


    console.log("chatId:", chatId);
// console.log("userId:", req.user?.id);
   
    if(!chat){
        return res.status(404).json({
            message:"Can not found"
        })
    }

     await messageModel.deleteMany({
        chat:chatId
    })


    res.status(200).json({
        message:"Chat deleted successfully"
    })
}

