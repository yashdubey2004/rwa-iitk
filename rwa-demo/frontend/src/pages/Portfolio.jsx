import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { getPortfolio } from '../services/api.js'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function simulateYieldSeries(invested, apr) {
  const days = 30
  const daily = (invested * apr) / 365
  const labels = Array.from({ length: days }, (_, i) => `Day ${i+1}`)
  const data = Array.from({ length: days }, (_, i) => daily * (i+1))
  return { labels, data }
}

export default function Portfolio() {
  const { token } = AuthContext.use()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getPortfolio(token).then(d => { if (active) setData(d) }).finally(()=>active && setLoading(false))
    return () => { active = false }
  }, [token])

  if (loading) return <div>Loading portfolio...</div>
  if (!data) return <div>Failed to load</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Portfolio</h2>
      <div className="grid gap-4">
        {data.holdings.length === 0 && <div className="text-gray-500">No holdings yet. Buy tokens in the Marketplace.</div>}
        {data.holdings.map(h => {
          const series = simulateYieldSeries(h.invested_amount, h.interest_rate)
          return (
            <div key={h.bond_id} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{h.bond_name}</div>
                  <div className="text-sm text-gray-600">Tokens: {h.tokens_owned} • APR {(h.interest_rate*100).toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Invested: ${h.invested_amount.toFixed(2)} • Accrued Yield: <span className="text-green-600">${h.accrued_yield.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="mt-4">
                <Line height={80} data={{
                  labels: series.labels,
                  datasets: [{ label: 'Simulated 30-day Yield', data: series.data, borderColor: 'rgb(59,130,246)' }]
                }} options={{ plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v)=>'$'+v } } } }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
