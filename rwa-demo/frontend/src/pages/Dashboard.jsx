import { useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { getPortfolio } from '../services/api.js'

export default function Dashboard() {
  const { token } = AuthContext.use()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getPortfolio(token).then(d => { if (active) setData(d) }).finally(()=>active && setLoading(false))
    return () => { active = false }
  }, [token])

  if (loading) return <div>Loading dashboard...</div>
  if (!data) return <div>Failed to load</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500">Stablecoin Balance</div>
          <div className="text-2xl font-bold">${data.balance.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500">Total Invested</div>
          <div className="text-2xl font-bold">${data.total_invested.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500">Total Yield Earned</div>
          <div className="text-2xl font-bold text-green-600">${data.total_yield.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
