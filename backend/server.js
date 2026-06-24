import "dotenv/config"
import app from './src/app.js'
import http from 'http'
import connectDB from './src/config/database.js'
import { initSocket } from "./src/sockets/server.socket.js"

const httpServer = http.createServer(app)
initSocket(httpServer)

connectDB()
.catch((err)=>{
    console.log("MongoDB connection faild:",err);
    process.exit(1)
    
})

httpServer.listen(3000,()=>{
    console.log(`server running on port 3000`);
    
})



// const io = getIO();

// io.on("connection", (socket) => {
//   console.log("New connection:", socket.id);

//   socket.on("send_message", async ({ message, chatId }) => {
//     console.log("Message received:", message);

//     let aiMessage = "";
//     const chunks = ["Hello ", "this is ", "AI streaming!"]; // replace with real AI output

//     for (const chunk of chunks) {
//       aiMessage += chunk;
//       io.to(socket.id).emit("ai_chunk", { chatId, content: chunk });
//       await new Promise((r) => setTimeout(r, 500)); // simulate streaming delay
//     }

//     io.to(socket.id).emit("ai_end", { chatId });
//   });
// });