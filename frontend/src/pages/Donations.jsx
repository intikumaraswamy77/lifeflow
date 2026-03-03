import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Toaster, toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'

const Donations = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [donations, setDonations] = useState([])
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.userType !== 'bloodbank') {
      setError('Only blood banks can view donations')
      return
    }
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await apiClient.request('/donations')
        setDonations(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('Fetch donations failed', e)
        setError('Failed to load donations')
        toast.error('Failed to load donations')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user])

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleString() } catch { return String(d) }
  }

  const groups = ['','A+','A-','B+','B-','AB+','AB-','O+','O-']

  const filtered = donations.filter(d => {
    const matchesText = q.trim() === '' || [
      d.donorName, 
      d.donorId?.name, 
      d.notes, 
      d.mobileNumber, 
      d.age ? String(d.age) : ''
    ].some(x => (x||'').toLowerCase().includes(q.toLowerCase()))
    const matchesGroup = !group || (d.bloodGroup === group)
    return matchesText && matchesGroup
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" richColors />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
        <p className="text-gray-500">All recorded donations for your blood bank</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <Input placeholder="Search by donor name, mobile, age, notes" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
            <select value={group} onChange={(e)=>setGroup(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
              {groups.map(g => <option key={g} value={g}>{g === '' ? 'All' : g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">No donations found</CardContent>
            </Card>
          ) : (
            filtered.map((d) => {
              const donorAge = d.age || null;
              const donorPhone = d.mobileNumber || null;
              return (
                <Card key={d._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{d.donorName || d.donorId?.name || 'Unknown Donor'}</span>
                      <span className="text-sm font-normal text-gray-500">{fmtDate(d.donationDate || d.createdAt)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Blood Group</div>
                        <div className="text-gray-900 font-medium">{d.bloodGroup}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Quantity</div>
                        <div className="text-gray-900 font-medium">{d.quantity} {d.unit || 'packets'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Age</div>
                        <div className="text-gray-900 font-medium">{donorAge ? `${donorAge} years` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Mobile</div>
                        <div className="text-gray-900 font-medium">{donorPhone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Notes</div>
                        <div className="text-gray-900 font-medium">{d.notes || '-'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Donations
