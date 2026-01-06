import { useState } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { login, register } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const nav = useNavigate()
  const { setToken } = AuthContext.use()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const resp = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password)
      setToken(resp.token)
      nav('/dashboard')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center py-12">
      <div>
        <h1 className="text-4xl font-bold mb-4">Fractional Tokenized Government Bonds</h1>
        <p className="text-gray-600 mb-4">Demo platform simulating RWA bond tokenization, trading, and yield — no blockchain involved. Purely backend-driven logic with daily yield accrual on demand.</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Buy fractional bond tokens with mock USDC</li>
          <li>Daily yield accrual based on annual rate</li>
          <li>Redeem tokens to receive principal + yield</li>
        </ul>
      </div>
      <form onSubmit={submit} className="bg-white p-6 rounded shadow">
        <div className="flex gap-4 mb-4">
          <button type="button" onClick={()=>setMode('login')} className={`px-3 py-1 border rounded ${mode==='login'?'bg-blue-50 border-blue-400':''}`}>Login</button>
          <button type="button" onClick={()=>setMode('register')} className={`px-3 py-1 border rounded ${mode==='register'?'bg-blue-50 border-blue-400':''}`}>Register</button>
        </div>
        {mode==='register' && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Name</label>
            <input className="border p-2 rounded w-full" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          </div>
        )}
        <div className="mb-3">
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="border p-2 rounded w-full" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="border p-2 rounded w-full" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading?'Loading...':'Start Investing'}</button>
        <p className="text-xs text-gray-500 mt-2">Demo credentials available after seeding: demo@example.com / password123</p>
      </form>
    </div>
  )
}
