import { useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { getPortfolio, redeem } from '../services/api.js'

export default function Redemption() {
  const { token } = AuthContext.use()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(0)
  const [toast, setToast] = useState('')

  const refresh = async () => {
    setLoading(true)
    const d = await getPortfolio(token)
    setData(d)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [token])

  const select = (h) => { setSelected(h); setQty(h.tokens_owned) }

  const onRedeem = async () => {
    setToast('')
    try {
      await redeem(token, selected.bond_id, parseInt(qty))
      setToast('Redemption successful!')
      setSelected(null)
      await refresh()
    } catch (e) {
      setToast('Redemption failed: ' + e.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Redeem Tokens</h2>
      <div className="grid gap-3">
        {data.holdings.length === 0 && <div className="text-gray-500">No holdings to redeem.</div>}
        {data.holdings.map(h => (
          <div key={h.bond_id} className="bg-white p-4 rounded shadow flex items-center justify-between">
            <div>
              <div className="font-semibold">{h.bond_name}</div>
              <div className="text-sm text-gray-600">Tokens: {h.tokens_owned} • Accrued Yield: ${h.accrued_yield.toFixed(2)}</div>
            </div>
            <button onClick={()=>select(h)} className="px-3 py-1 bg-blue-600 text-white rounded">Redeem</button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <div className="font-semibold mb-2">Redeem {selected.bond_name}</div>
            <div className="mb-3">
              <label className="block text-sm">Quantity</label>
              <input type="number" min="1" max={selected.tokens_owned} value={qty} onChange={e=>setQty(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div className="text-sm text-gray-600 mb-3">Payout preview includes principal + prorated accrued yield.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setSelected(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={onRedeem} className="px-3 py-1 bg-blue-600 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded">{toast}</div>
      )}
    </div>
  )
}
