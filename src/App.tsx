import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>GrowHub Accelerator</h1>
        <p>Plateforme de gestion d'accélérateur</p>
      </header>
      <main className="main">
        <div className="card">
          <h2>Application Full-Stack</h2>
          <p>Frontend déployé sur Vercel avec backend sur Bolt et base de données Supabase.</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>React + Vite</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Vercel</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Bolt API</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Supabase</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
