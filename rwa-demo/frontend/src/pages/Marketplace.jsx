import { useEffect, useState } from 'react'
import { listBonds, buy, getPortfolio } from '../services/api.js'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Marketplace() {
  const { token } = AuthContext.use()
  const [bonds, setBonds] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    listBonds().then(b => { if (active) setBonds(b) }).finally(()=>active && setLoading(false))
    return () => { active = false }
  }, [])

  const submitBuy = async () => {
    setToast('')
    try {
      await buy(token, buying.id, parseInt(qty))
      setToast(`Bought ${qty} tokens of ${buying.bond_name}`)
      setBuying(null)
      const updated = await listBonds(); setBonds(updated)
      await getPortfolio(token) // triggers accrual on backend
    } catch (e) {
      setToast('Buy failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Bond Marketplace</h2>
      {loading ? <div>Loading bonds...</div> : (
        <div className="grid md:grid-cols-3 gap-4">
          {bonds.map(b => (
            <div key={b.id} className="bg-white p-4 rounded shadow flex flex-col gap-2">
              <div className="font-semibold">{b.bond_name}</div>
              <div className="text-sm text-gray-500">Rate: {(b.interest_rate*100).toFixed(2)}% APR</div>
              <div className="text-sm text-gray-500">Token Price: ${b.token_price}</div>
              <div className="text-sm text-gray-500">Available: {b.available_tokens}</div>
              <button onClick={()=>{setBuying(b); setQty(1)}} className="mt-2 bg-blue-600 text-white py-1 rounded">Buy</button>
            </div>
          ))}
        </div>
      )}

      {buying && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <div className="font-semibold mb-2">Buy {buying.bond_name}</div>
            <div className="mb-3">
              <label className="block text-sm">Quantity</label>
              <input type="number" min="1" max={buying.available_tokens} value={qty} onChange={e=>setQty(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div className="mb-3 text-sm text-gray-600">Cost: ${(buying.token_price * (parseInt(qty)||0)).toFixed(2)}</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setBuying(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={submitBuy} className="px-3 py-1 bg-blue-600 text-white rounded">Confirm</button>
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
