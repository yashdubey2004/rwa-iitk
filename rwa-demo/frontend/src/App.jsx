import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Redemption from './pages/Redemption.jsx'
import { AuthContext } from './context/AuthContext.jsx'
import { getMe } from './services/api.js'

function Navbar() {
  const nav = useNavigate();
  const { user, setUser, token, setToken } = AuthContext.use();
  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null); nav('/'); };
  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-blue-600">RWA Bonds</Link>
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <Link to="/marketplace" className="hover:text-blue-600">Marketplace</Link>
          <Link to="/portfolio" className="hover:text-blue-600">Portfolio</Link>
          <Link to="/redeem" className="hover:text-blue-600">Redeem</Link>
          {token ? (
            <button onClick={logout} className="px-3 py-1 border rounded">Logout</button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

function Protected({ children }) {
  const { token } = AuthContext.use();
  if (!token) return <Navigate to="/" />
  return children;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return;
    getMe(token).then(u => setUser(u)).catch(()=>{})
  }, [token])

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
  }, [token])

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken }}>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
            <Route path="/portfolio" element={<Protected><Portfolio /></Protected>} />
            <Route path="/redeem" element={<Protected><Redemption /></Protected>} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  )
}
