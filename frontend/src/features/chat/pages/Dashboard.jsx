import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useChat } from '../hooks/useChat'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { setCurrentChatId } from '../chat.sclice'

// A component to render the AI responses in simulated chunks/words (typewriter effect)
const StreamedMessage = ({ content, speed = 20 }) => {
  const [displayedContent, setDisplayedContent] = useState('')
  
  useEffect(() => {
    if (!content) {
      setDisplayedContent('')
      return
    }

    // Split content by spaces/newlines but preserve separators to render formatting cleanly
    const words = content.split(/(\s+)/)
    let currentWordIndex = 0
    let currentText = ''
    
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += words[currentWordIndex]
        setDisplayedContent(currentText)
        currentWordIndex++
      } else {
        clearInterval(interval)
      }
    }, speed)
    
    return () => clearInterval(interval)
  }, [content, speed])
  
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline ? (
            <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-black/40 font-mono text-xs">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <span>{match ? match[1].toLowerCase() : 'code'}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                  className="hover:text-blue-500 dark:hover:text-white transition duration-150 flex items-center gap-1 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="p-4 overflow-x-auto text-[#6dddff] font-mono leading-relaxed bg-[#0b0e14] dark:bg-black/25">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            </div>
          ) : (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-blue-400 font-mono text-xs" {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {displayedContent}
    </ReactMarkdown>
  )
}

const Dashboard = () => {
  const chat = useChat()
  const dispatch = useDispatch()
  
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [pendingPrompt, setPendingPrompt] = useState(null)
  const [animatingIndex, setAnimatingIndex] = useState(-1)

  const messagesEndRef = useRef(null)
  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const user = useSelector((state) => state.auth.user)

  // Initialize connection and fetch chats
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

  // Stop loading when new AI message arrives
  useEffect(() => {
    const messages = chats[currentChatId]?.messages
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role !== "user") {
        setLoading(false)
      }
    }
  }, [chats, currentChatId])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chats, currentChatId, loading, pendingPrompt])

  // Send message
  const handleSubmitMessage = (event) => {
    event.preventDefault()
    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage) return

    setPendingPrompt(trimmedMessage)
    chat.handleSendMessage({ message: trimmedMessage, chatId: currentChatId })
    setLoading(true)
    setChatInput("")
  }

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
  }

  const deleteChat = (chatId) => {
    chat.handleDeleteChat(chatId)
    if (currentChatId === chatId) {
      dispatch(setCurrentChatId(null))
    }
  }

  // Pre-loaded suggestions for new workspace
  const suggestions = [
    {
      title: "Analyze Market Trends",
      desc: "Review high-performance computing hardware adoption in the cloud.",
      prompt: "Can you analyze the latest market trends for high-performance computing?"
    },
    {
      title: "Optimize React State",
      desc: "Debug re-renders and memory leaks in Redux slice hooks.",
      prompt: "How can I optimize state re-renders and prevent memory leaks in Redux Toolkit?"
    },
    {
      title: "Secure a Node.js API",
      desc: "Write a router middleware validating JWT payloads and origin rules.",
      prompt: "Show me a secure Node.js router middleware with JWT authentication and CORS policies."
    },
    {
      title: "Explain Quantum Cryptography",
      desc: "Simplify the principles of the BB84 protocol for beginners.",
      prompt: "Can you simplify quantum cryptography and explain the BB84 protocol?"
    }
  ]

  // Filter sidebar chats
  const filteredChats = Object.values(chats).filter(chatItem => 
    (chatItem.title || "").toLowerCase().includes(chatSearch.toLowerCase())
  )

  const currentChat = chats[currentChatId]
  const rawMessages = currentChat?.messages || []

  // Check if messages have loaded in Redux to clear the local pending prompt state
  useEffect(() => {
    if (rawMessages.length > 0) {
      const lastMsg = rawMessages[rawMessages.length - 1]
      if (lastMsg.role === 'user' || lastMsg.content === pendingPrompt) {
        setPendingPrompt(null)
      }
    }
  }, [rawMessages, pendingPrompt])

  // Handle setting animatingIndex when a new AI response is received
  useEffect(() => {
    if (rawMessages.length > 0) {
      const lastIdx = rawMessages.length - 1
      const lastMsg = rawMessages[lastIdx]
      if (lastMsg.role !== 'user' && animatingIndex < lastIdx) {
        setAnimatingIndex(lastIdx)
      }
    }
  }, [rawMessages.length, animatingIndex])

  // Manage animatingIndex on workspace change
  useEffect(() => {
    if (currentChatId) {
      const msgs = chats[currentChatId]?.messages || []
      if (pendingPrompt) {
        const lastAiIdx = msgs.findIndex(m => m.role !== 'user')
        setAnimatingIndex(lastAiIdx !== -1 ? lastAiIdx : msgs.length)
      } else {
        setAnimatingIndex(msgs.length)
      }
      setPendingPrompt(null)
    } else {
      setAnimatingIndex(-1)
      setPendingPrompt(null)
    }
  }, [currentChatId])

  const hasMessages = rawMessages.length > 0
  const showChatStream = hasMessages || loading || pendingPrompt
  const activeChatTitle = currentChat?.title || "New Workspace"

  return (
    <main className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#051424] text-slate-800 dark:text-[#d4e4fa] font-sans transition-colors duration-300">
      
      {/* Sidebar Panel */}
      <aside className="w-[280px] h-full flex flex-col bg-white dark:bg-[#0d1c2d]/95 border-r border-slate-200 dark:border-[#1e293b] flex-shrink-0 transition-all duration-300 z-20">
        
        {/* Sidebar Header & Brand Logo */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              A
            </div>
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              AdiNova
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
        </div>

        {/* Action: Create New Session */}
        <div className="px-4 py-4">
          <button
            onClick={() => dispatch(setCurrentChatId(null))}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Session
          </button>
        </div>

        {/* Sidebar Search Filter */}
        <div className="px-4 mb-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </span>
            <input
              type="text"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#051424] text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition duration-200"
            />
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No sessions found
            </div>
          ) : (
            filteredChats.map((chatItem) => {
              const isActive = chatItem.id === currentChatId
              return (
                <div
                  key={chatItem.id}
                  className={`group relative flex items-center rounded-xl transition duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <button
                    onClick={() => openChat(chatItem.id)}
                    className="flex-1 flex items-center gap-3 px-3 py-3 text-left overflow-hidden cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.724-.606 5.972 5.972 0 0 1 1.096-3.32C4.16 15.657 3 13.987 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    <span className="truncate text-xs">{chatItem.title}</span>
                  </button>
                  
                  <button
                    onClick={() => deleteChat(chatItem.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 mr-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition duration-150 cursor-pointer"
                    title="Delete session"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* User profile section at the bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1e293b]/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.username || 'Researcher'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'authenticated'}
              </p>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <section className="flex-1 h-full flex flex-col overflow-hidden relative">
        
        {/* Main Header / Control Topbar */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b]/60 bg-white/80 dark:bg-[#051424]/80 backdrop-blur-md z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-white max-w-[200px] md:max-w-md truncate">
              {activeChatTitle}
            </h2>
            {showChatStream && (
              <span className="px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                Active Session
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M9.75 12h4.5M9.75 3.75H14.25M9.75 20.25H14.25m-6.75-9.75h-.75m16.5 0h-.75m-9-9a9 9 0 0 0-9 9m18 0a9 9 0 0 0-9-9Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 4.57 0 8.358-3.14 9.402-7.398Z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Central Chat Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scroll-smooth no-scrollbar bg-slate-50 dark:bg-[#051424]">
          
          {showChatStream ? (
            // Render Chat Log
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Existing messages */}
              {rawMessages.map((message, index) => {
                const isUser = message.role === 'user'
                return (
                  <div
                    key={index}
                    className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Robot Avatar for AI */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096M9 21h3m-3.375-3.375h3.375M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-6.5-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>
                      </div>
                    )}

                    {/* Chat Bubble content */}
                    <div
                      className={`rounded-2xl px-5 py-3.5 shadow-sm max-w-[80%] leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                          : 'bg-white dark:bg-[#122131] border border-slate-200 dark:border-[#273647]/50 text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="prose dark:prose-invert prose-sm max-w-none text-inherit font-sans prose-headings:font-semibold prose-a:text-blue-500 dark:prose-a:text-blue-400">
                          {index === animatingIndex ? (
                            <StreamedMessage content={message.content} />
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline ? (
                                    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-black/40 font-mono text-xs">
                                      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <span>{match ? match[1].toLowerCase() : 'code'}</span>
                                        <button 
                                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                          className="hover:text-blue-500 dark:hover:text-white transition duration-150 flex items-center gap-1 cursor-pointer"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5" />
                                          </svg>
                                          Copy
                                        </button>
                                      </div>
                                      <div className="p-4 overflow-x-auto text-[#6dddff] font-mono leading-relaxed bg-[#0b0e14] dark:bg-black/25">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </div>
                                    </div>
                                  ) : (
                                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-blue-400 font-mono text-xs" {...props}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Pending prompt (rendered while awaiting backend response) */}
              {pendingPrompt && (
                <div className="flex justify-end gap-4">
                  <div className="rounded-2xl px-5 py-3.5 shadow-sm max-w-[80%] leading-relaxed bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-blue-500/10">
                    <p className="text-sm whitespace-pre-wrap">{pendingPrompt}</p>
                  </div>
                </div>
              )}

              {/* Pulsing Dots AI typing loading indicator */}
              {loading && (
                <div className="flex justify-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096M9 21h3m-3.375-3.375h3.375M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-6.5-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-[#122131] border border-slate-200 dark:border-[#273647]/50 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Ref to anchor scroll */}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            // Render Suggestions Welcome Page (Empty State)
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-3xl mx-auto h-full">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096M9 21h3m-3.375-3.375h3.375M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-6.5-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                AdiNova Workspace
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-md">
                Your advanced AI developer partner. Pick one of the prompts below or type your query to start coding.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatInput(s.prompt)
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0d1c2d]/60 hover:bg-slate-50 dark:hover:bg-[#122131]/60 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 group text-left cursor-pointer"
                  >
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-blue-500 transition duration-150 mb-1">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {s.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Message Input Box */}
        <div className="p-6 border-t border-slate-200 dark:border-[#1e293b]/60 bg-white/70 dark:bg-[#051424]/70 backdrop-blur-md transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmitMessage} className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message to AdiNova..."
                className="w-full rounded-full pl-6 pr-14 py-4 border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0d1c2d] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 text-sm shadow-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  chatInput.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2 tracking-wide">
              AdiNova can make mistakes. Verify important code fragments.
            </p>
          </div>
        </div>

      </section>

    </main>
  )
}

export default Dashboard