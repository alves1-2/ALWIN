import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [content, setContent] = useState(null)
  const [registrationForm, setRegistrationForm] = useState({ email: '', phone: '', username: '' })
  const [loginForm, setLoginForm] = useState({ username: '' })
  const [message, setMessage] = useState('')
  const [lastResponse, setLastResponse] = useState(null)
  const [apiStatus, setApiStatus] = useState('unknown')
  const [loadingRegister, setLoadingRegister] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loadingPay, setLoadingPay] = useState(false)
  const [loadingEarn, setLoadingEarn] = useState(false)
  const [showPaymentNumber, setShowPaymentNumber] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    // quick backend health check
    ;(async () => {
      try {
        const res = await fetch('/api')
        const data = await res.json()
        setApiStatus(res.ok ? 'ok' : 'error')
        setLastResponse(data)
      } catch (err) {
        setApiStatus('down')
        setLastResponse({ error: err.message })
      }
    })()
  }, [])

  useEffect(() => {
    if (user && user.paymentStatus) {
      fetchContent()
    }
  }, [user])

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/content/${user.id}`)
      const data = await res.json()
      if (res.ok) {
        setContent(data)
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoadingRegister(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationForm)
      })
      const data = await res.json()
      setLastResponse(data)
      if (res.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setMessage('Registration successful! Please complete payment.')
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      setMessage('Registration failed')
    }
    setLoadingRegister(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoadingLogin(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      setLastResponse(data)
      if (res.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setMessage('Login successful!')
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      setMessage('Login failed')
    }
    setLoadingLogin(false)
  }

  const handlePay = async () => {
    setLoadingPay(true)
    try {
      const res = await fetch(`/api/pay/${user.id}`, { method: 'POST' })
      const data = await res.json()
      setLastResponse(data)
      if (res.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setMessage('KWISHYURA: Payment confirmed! Welcome to the platform.')
        fetchContent()
      }
    } catch (error) {
      setMessage('Payment confirmation failed')
    }
    setLoadingPay(false)
  }

  const handleEarn = async () => {
    setLoadingEarn(true)
    try {
      const res = await fetch(`/api/earn/${user.id}`, { method: 'POST' })
      const data = await res.json()
      setLastResponse(data)
      if (res.ok) {
        setContent(prev => ({ ...prev, earnings: data.totalEarnings }))
        setMessage('Earned 10!')
      }
    } catch (error) {
      setMessage('Failed to earn')
    }
    setLoadingEarn(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setContent(null)
    setMessage('')
    setIsLogin(false)
  }

  const filteredContent = content ? {
    videos: content.videos.filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    ads: content.ads.filter(ad => 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ad.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    earnings: content.earnings
  } : null

  if (user && content) {
    return (
      <div className="App">
        <h1>Welcome to ALWIN, {user.username}!</h1>
        <p>Your earnings: {content.earnings}</p>
        <input
          type="text"
          placeholder="Search videos and ads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />
        <button onClick={handleEarn} disabled={loadingEarn}>{loadingEarn ? 'Earning...' : 'Watch Ad/Video to Earn'}</button>
        <button onClick={handleLogout}>Logout</button>
        <h2>Videos</h2>
        <ul>
          {filteredContent.videos.map(video => {
            const url = video.url || ''
            const id = url.includes('v=') ? url.split('v=')[1] : url.split('/').pop()
            const embedId = id || ''
            return (
              <li key={video.id}>
                <h3>{video.title}</h3>
                <iframe 
                  width="560" 
                  height="315" 
                  src={`https://www.youtube.com/embed/${embedId}`} 
                  title={video.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </li>
            )
          })}
        
        </ul>
        <h2>Advertisements</h2>
        <ul>
          {filteredContent.ads.map(ad => (
            <li key={ad.id}>{ad.title}: {ad.content}</li>
          ))}
        </ul>
        {message && <p>{message}</p>}
        <div className="debug-panel">
          <h3>API status: {apiStatus}</h3>
          <details>
            <summary>Last API response (debug)</summary>
            <pre style={{maxHeight: 300, overflow: 'auto'}}>{JSON.stringify(lastResponse, null, 2)}</pre>
          </details>
        </div>
      </div>
    )
  }

  if (user && !user.paymentStatus) {
    return (
      <div className="App">
        <h1>Payment Required</h1>
        <p className="payment-notice">Direct payment required: Pay 1700 RWF to 079***8208</p>
        <button onClick={() => setShowPaymentNumber(!showPaymentNumber)}>
          {showPaymentNumber ? 'Hide Full Number' : 'Reveal Full Number'}
        </button>
        {showPaymentNumber && <p className="full-number">Full Number: 0793758208</p>}
        <button onClick={handlePay}>I Have Paid - Confirm</button>
        <button onClick={handleLogout}>Logout</button>
        {message && <div className="notification">{message}</div>}
        <div className="debug-panel">
          <h3>API status: {apiStatus}</h3>
          <details>
            <summary>Last API response (debug)</summary>
            <pre style={{maxHeight: 300, overflow: 'auto'}}>{JSON.stringify(lastResponse, null, 2)}</pre>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <h1>ALWIN</h1>
      <div className="auth-toggle">
        <button onClick={() => setIsLogin(false)} className={!isLogin ? 'active' : ''}>Register</button>
        <button onClick={() => setIsLogin(true)} className={isLogin ? 'active' : ''}>Login</button>
      </div>
      {isLogin ? (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ username: e.target.value })}
            required
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            value={registrationForm.email}
            onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone (+250...)"
            value={registrationForm.phone}
            onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={registrationForm.username}
            onChange={(e) => setRegistrationForm({ ...registrationForm, username: e.target.value })}
            required
          />
          <button type="submit">Register</button>
        </form>
      )}
      {message && <p>{message}</p>}
      <div className="debug-panel">
        <h3>API status: {apiStatus}</h3>
        <details>
          <summary>Last API response (debug)</summary>
          <pre style={{maxHeight: 300, overflow: 'auto'}}>{JSON.stringify(lastResponse, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}

export default App