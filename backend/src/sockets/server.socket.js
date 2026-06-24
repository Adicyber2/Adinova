import { Server } from "socket.io";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  console.log("Socket.io server is RUNNING");

  const geminiModel = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
   model: "gemini-2.5-flash-lite",
   streaming:true
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("ask_ai", async (prompt) => {
      try {

        let streames=false

        const stream = await geminiModel.stream([["human",prompt]]);

        for await (const chunk of stream) {

            console.log("Chunk",chunk);
            console.log(JSON.stringify(chunk, null, 2));
            
          let text = "";

  if (typeof chunk.content === "string") {
    text = chunk.content;
  } else if (Array.isArray(chunk.content)) {
    text = chunk.content.map(c => c.text || "").join("");
  }

          if(text){
            streames=true
            socket.emit("ai_chunk",text)
            console.log("SENT",text);
          }
          
        }

        if(!streames){
          console.log("Striming is Failed")
          const res = await geminiModel.invoke(prompt)
          socket.emit("ai_chunk",res.content)
        }

        socket.emit("ai_done")
      } catch (err) {
        console.error(err);
        // socket.emit("ai_error", "Something went wrong");

        const res = await geminiModel.invoke(prompt)
        socket.emit("ai_chunk",res.content)
        socket.emit("ai_done")
      }
    });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}