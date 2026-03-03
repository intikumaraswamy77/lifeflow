import React, { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, CheckCircle2, AlertTriangle, Calendar, Activity, Droplets, Heart, Loader2 } from 'lucide-react'
import apiClient from '../lib/api'

const Eligibility = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '',
    weight: '',
    hemoglobin: '',
    lastDonationDate: '',
    hadFever: false,
    recentSurgery: false,
    onMedications: false,
    alcoholLast24h: false,
    pregnantOrBreastfeeding: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const computeAge = (dobStr) => {
    if (!dobStr) return null
    const today = new Date()
    const dob = new Date(dobStr)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  const assessment = useMemo(() => {
    const reasons = []
    let eligible = true

    const age = computeAge(form.dateOfBirth)
    if (age === null) {
      eligible = false
      reasons.push('Please provide your date of birth to calculate age')
    } else if (age < 18 || age > 65) {
      eligible = false
      reasons.push('Age must be between 18 and 65 years')
    }

    const weight = Number(form.weight)
    if (!weight) {
      eligible = false
      reasons.push('Please enter your weight')
    } else if (weight < 50) {
      eligible = false
      reasons.push('Minimum weight for donation is 50 kg')
    }

    const hb = Number(form.hemoglobin)
    if (!hb) {
      eligible = false
      reasons.push('Please enter your hemoglobin')
    } else if (hb < 12.5) {
      eligible = false
      reasons.push('Hemoglobin must be at least 12.5 g/dL')
    }

    if (form.lastDonationDate) {
      const last = new Date(form.lastDonationDate)
      const now = new Date()
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))
      if (diffDays < 90) {
        eligible = false
        reasons.push('At least 90 days must have passed since your last whole blood donation')
      }
    }

    if (form.hadFever) { eligible = false; reasons.push('You currently report fever/active infection') }
    if (form.recentSurgery) { eligible = false; reasons.push('Recent major surgery requires deferral') }
    if (form.onMedications) { reasons.push('Some medications may defer donation—confirm with staff') }
    if (form.alcoholLast24h) { eligible = false; reasons.push('Avoid alcohol 24 hours prior to donation') }
    if (form.gender === 'female' && form.pregnantOrBreastfeeding) { eligible = false; reasons.push('Cannot donate while pregnant or breastfeeding') }

    return { eligible, reasons }
  }, [form])

  const handleProceed = async () => {
    if (!assessment.eligible) return

    setLoading(true)
    setError('')

    try {
      const response = await apiClient.checkEligibility(form)

      if (response.eligible && response.eligibilityToken) {
        // Store eligibility token for registration
        localStorage.setItem('eligibilityToken', response.eligibilityToken)
        localStorage.setItem('eligibilityData', JSON.stringify(response.eligibilityData))
        navigate('/register?type=donor')
      } else {
        setError(response.message || 'Eligibility check failed')
      }
    } catch (err) {
      setError(err.message || 'Failed to verify eligibility. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-4 text-xs text-gray-500">This eligibility self-check is for <span className="font-semibold text-gray-700">donors</span> only.</div>
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Donor Eligibility Check</h1>
          </div>
          <p className="text-gray-600 mb-6">
            This quick self-check helps you understand if you meet common donation guidelines. Final eligibility is assessed by medical staff.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <div className="relative">
                <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="pl-9 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <div className="relative">
                <Activity className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input type="number" min="0" step="0.1" name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 68" className="pl-9 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hemoglobin (g/dL)</label>
              <div className="relative">
                <Droplets className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input type="number" min="0" step="0.1" name="hemoglobin" value={form.hemoglobin} onChange={handleChange} placeholder="e.g. 13.2" className="pl-9 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Donation Date (optional)</label>
              <input type="date" name="lastDonationDate" value={form.lastDonationDate} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="inline-flex items-center">
              <input type="checkbox" name="hadFever" checked={form.hadFever} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">Fever or active infection</span>
            </label>
            <label className="inline-flex items-center">
              <input type="checkbox" name="recentSurgery" checked={form.recentSurgery} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">Recent major surgery</span>
            </label>
            <label className="inline-flex items-center">
              <input type="checkbox" name="onMedications" checked={form.onMedications} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">On medication that may defer</span>
            </label>
            <label className="inline-flex items-center">
              <input type="checkbox" name="alcoholLast24h" checked={form.alcoholLast24h} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">Alcohol in last 24 hours</span>
            </label>
            {form.gender === 'female' && (
              <label className="inline-flex items-center">
                <input type="checkbox" name="pregnantOrBreastfeeding" checked={form.pregnantOrBreastfeeding} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">Pregnant or breastfeeding</span>
              </label>
            )}
          </div>

          <div className="mt-8">
            {assessment.eligible ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-800">You look eligible to donate</div>
                  <div className="text-sm text-green-700">Final confirmation will be done during the onsite medical screening.</div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-800">You may not be eligible right now</div>
                    <ul className="mt-2 text-sm text-yellow-800 list-disc pl-5">
                      {assessment.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleProceed}
              disabled={!assessment.eligible || loading}
              className={`inline-flex items-center px-5 py-2.5 rounded-md text-white ${assessment.eligible && !loading ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} transition-colors`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Verifying...' : 'Proceed to Register'}
            </button>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Eligibility
