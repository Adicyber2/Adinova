import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const Dashboard = () => {
  const chat = useChat()
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  const socketRef = useRef(null)
  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)

  // Initialize
  useEffect(() => {
    chat.initializeSocketConnection()
    chat.handleGetChats()
  }, [])

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark")
      setDark(true)
    } else {
      document.documentElement.classList.remove("dark")
      setDark(false)
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setDark(true)
    }
  }

  // ✅ FIX: Stop loading when AI response arrives
  useEffect(() => {
    const messages = chats[currentChatId]?.messages

    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]

      if (lastMessage.role !== "user") {
        setLoading(false)
      }
    }
     console.log(messages);
  }, [chats, currentChatId])

 
  

  // Send message
  const handleSubmitMessage = (event) => {
    event.preventDefault()
    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage) return

    chat.handleSendMessage({ message: trimmedMessage, chatId: currentChatId })
    setLoading(true)
    setChatInput("")
  }

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
     
  }
  const deleteChat = (chatId)=>{
    chat.handleDeleteChat(chatId)
   
  }

  return (
    <main className='h-screen w-full flex px-3 py-6 app-bg'>
      <div className='flex h-full w-full gap-4'>

        {/* Sidebar */}
        <aside className='w-72 rounded-2xl p-4 flex flex-col gap-3 card'>
          <div className='flex justify-between items-center'>
            <h1 className='text-2xl font-bold'>AdiNova</h1>

            <div className='flex gap-2'>
              <button className='rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500'>
                + New
              </button>

              <button
                onClick={toggleTheme}
                className="px-3 py-1 rounded-lg bg-gray-200 transition"
              >
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          {/* Chat list */}
          <div className='overflow-y-auto flex-1 space-y-2'>
            {Object.values(chats).map((chatItem, index) => (
              <div className='flex border p-1 rounded-2xl'>
              <button
                onClick={() => openChat(chatItem.id)}
                key={index}
                className='w-full cursor-pointer  px-3 py-2 text-left'
              >
                {chatItem.title}

               
              </button>

               <button onClick={()=> deleteChat(chatItem.id)} className="p-1  rounded">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="w-5 h-"
        
      >
        <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z" />
      </svg>
    </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Section */}
        <section className='flex-1 rounded-2xl p-4 flex flex-col card'>

          {/* Messages */}
          <div className='flex-1 overflow-y-auto space-y-3 px-2 py-2'>

            {chats[currentChatId]?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg p-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white max-w-[50%]'
                      : 'card max-w-[82%]'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg p-2 card max-w-[82%]">
                  Loading...
                </div>
              </div>
            )}

          </div>

          {/* Input */}
          <div className='mt-3 flex justify-center mb-5'>
            <div className='relative w-full max-w-3xl'>
              <form onSubmit={handleSubmitMessage}>
                <input
                  type='text'
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className='w-full rounded-full px-4 py-3 pr-12 input focus:outline-none'
                  placeholder='Type your message...'
                />

                <button
                  type='submit'
                  disabled={!chatInput.trim()}
                  className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-500 '
                >
                  ➤
                </button>
              </form>
            </div>
          </div>

        </section>
      </div>
    </main>
  )
}

export default Dashboard