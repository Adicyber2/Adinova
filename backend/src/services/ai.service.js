import{ChatGoogleGenerativeAI} from "@langchain/google-genai"
import {ChatMistralAI} from '@langchain/mistralai'
import { HumanMessage,SystemMessage,AIMessage ,tool,createAgent} from "langchain";
import *as z from "zod"
import { searchInternet } from "./internet.service.js";

const geminiModel=new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
  apiKey: process.env.GOOGLE_AI_API_KEY
})




const misrtalModel=new ChatMistralAI({
    model:"mistral-small-latest",
    apiKey:process.env.MISTRAL_API_KEY
})

const searchInternetTool = tool(
    searchInternet,
    {
        name:"searchInternet",
        discription:"Use this tool to get latest information from the internet ",
        schema:z.object({
            query:z.string().describe("The search query to look up on the internet.")
        })

})

const agent = createAgent({
    model:geminiModel,
    tools:[searchInternetTool]
})

export async function generateMessage(messages){
    const response=await agent.invoke({
        messages:[
            new SystemMessage(`
                you are a helpful and precise assistant for answering questions.
                If you don'tknow the answer,say you don't know.
                If the question requires up-to-date information, use the "searchInternet" tool to get the latest
                information from the internet and then answer based on the search results.
            `),
        ...(messages.map(msg=>{
        if(msg.role=="user"){
            return new HumanMessage(msg.content)
        }else if(msg.role=="ai"){
            return new AIMessage(msg.content)
        }
    }))]
    });

    return response.messages[response.messages.length - 1].text
}


export async function generateChatTitle(message){

    const response = await misrtalModel.invoke([

        new SystemMessage(`you are a helpful assistant that generates concise and discriptiv title for chat conversion.
            
            User will provide you with the first message of a chat conversaton, and you will generate a title that 
            captures the essence of the conversation in a 2-4 words. The title should be clear , relevant , and engaging, giving a glimpse of the main topic or theme of the conversation. Please ensure that the title is concise and
             accurately reflects the content of the chat.`),
             new HumanMessage(`generate a title for a chat conversation bsed on the following first message: ${message}
                `)

    ])
    return response.text
}