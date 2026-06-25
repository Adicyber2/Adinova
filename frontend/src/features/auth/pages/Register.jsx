import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const naviget=useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const payload={
      email,
      username,
      password
    }
    alert("Check Email & Click Verify")

    naviget("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-800 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/55 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Create account</h2>
          
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-white/80">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/40 shadow-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-200/50"
              placeholder="Enter Username"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/40 shadow-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-200/50"
              placeholder="Enter Email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/40 shadow-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-200/50"
              placeholder="••••••••"
              required
            />
          </div>

         

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-red-200/40"
          >
            Create account
          </button>
          <p className="mt-2 text-sm text-white/70 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-white hover:text-red-200 text-">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
