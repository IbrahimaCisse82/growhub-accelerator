import React, { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) alert(error.message)
        else alert('Account created successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="app"><p>Loading...</p></div>
  }

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <h1>GrowHub Accelerator</h1>
          <p>Plateforme de gestion d'accélérateur</p>
        </header>
        <main className="main">
          <div className="card">
            <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ padding: '0.75rem', borderRadius: '4px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <p style={{ marginTop: '1rem' }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', textDecoration: 'underline' }}>
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>GrowHub Accelerator</h1>
        <p>Welcome, {user.email}</p>
      </header>
      <main className="main">
        <div className="card">
          <h2>Dashboard</h2>
          <p>You are now logged in to GrowHub Accelerator!</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>React + Vite</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Vercel</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Supabase</span>
          </div>
          <button onClick={handleSignOut} style={{ marginTop: '2rem', padding: '0.75rem 2rem', borderRadius: '4px', background: '#ff4444', color: 'white', border: 'none', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
