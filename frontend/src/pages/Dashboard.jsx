import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { getCurrentLocation } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Heart, 
  MapPin, 
  MessageCircle, 
  Users, 
  Activity,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Building2,
  Package,
  TrendingUp,
  Bell,
  Calendar,
  AlertTriangle,
  Trophy,
  Star,
  Share2,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Toaster, toast } from 'sonner';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [bloodStock, setBloodStock] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Motivational quotes
  const quotes = [
    "Be the reason someone believes in the goodness of people.",
    "Your blood donation can give someone a second chance at life.",
    "Heroes don't always wear capes, sometimes they just roll up their sleeves.",
    "The gift of blood is the gift of life. There is no greater gift than that.",
    "Donate blood and be someone's hero today."
  ];

  // Health tips for donors
  const healthTips = [
    "Stay hydrated by drinking plenty of water",
    "Eat iron-rich foods like spinach and red meat",
    "Get adequate sleep (7-8 hours) before donating",
    "Avoid alcohol 24 hours before donation",
    "Eat a healthy meal before donating blood",
    "Take vitamin C to help iron absorption"
  ];

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load blood stock for blood banks
      if (user?.userType === 'bloodbank') {
        const stock = await apiClient.getBloodStock();
        setBloodStock(stock);
      }

      // Load unread message count
      const { count } = await apiClient.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const updateBloodStock = async (bloodGroup, change) => {
    try {
      const currentQuantity = bloodStock[bloodGroup]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      await apiClient.updateBloodStock(bloodGroup, { 
        quantity: newQuantity,
        unit: 'packets'
      });
      
      setBloodStock(prev => ({
        ...prev,
        [bloodGroup]: {
          ...prev[bloodGroup],
          quantity: newQuantity
        }
      }));
    } catch (error) {
      setError('Failed to update blood stock');
    }
  };

  const PatientDashboard = () => {
    const [searchLocation, setSearchLocation] = useState({ latitude: '', longitude: '' });
    const [locationLoading, setLocationLoading] = useState(false);
    // Ensure calendar helpers have a valid date in patient view
    const nextEligibleDate = new Date();

    const detectLocation = async () => {
      setLocationLoading(true);
      try {
        const location = await getCurrentLocation();
        setSearchLocation({
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString()
        });
      } catch (error) {
        setError('Failed to detect location. Please enter manually.');
      } finally {
        setLocationLoading(false);
      }
    };

    // Reminder helpers
    const pad = (n) => String(n).padStart(2, '0');
    const toYmd = (date) => `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`;
    const toYmdHisZ = (date) => {
      const d = new Date(date);
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const openGoogleCalendar = () => {
      try {
        const title = 'Next Eligible Blood Donation';
        const details = 'Reminder set from LifeFlow to donate blood.';
        const start = toYmd(nextEligibleDate);
        const endDate = new Date(nextEligibleDate); endDate.setDate(endDate.getDate() + 1);
        const end = toYmd(endDate);
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${start}/${end}`;
        window.open(url, '_blank', 'noopener');
      } catch (e) {
        console.error('Google Calendar link error:', e);
        toast.error('Could not open Google Calendar');
      }
    };

    const downloadICS = () => {
      try {
        const title = 'Next Eligible Blood Donation';
        const description = 'Reminder set from LifeFlow to donate blood.';
        const uid = `${Date.now()}@lifeflow`;
        const start = toYmd(nextEligibleDate);
        const endDate = new Date(nextEligibleDate); endDate.setDate(endDate.getDate() + 1);
        const end = toYmd(endDate);
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//LifeFlow//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${toYmdHisZ(new Date())}`,
          `DTSTART;VALUE=DATE:${start}`,
          `DTEND;VALUE=DATE:${end}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${description}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lifeflow-reminder.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('ICS downloaded');
      } catch (e) {
        console.error('ICS download error:', e);
        toast.error('Could not download ICS');
      }
    };


    // Freeze quote so it doesn't change on every re-render
    const [patientSelectedQuote] = useState(
      quotes[Math.floor(Math.random() * quotes.length)]
    );

    return (
      <div className="space-y-6">
        <Toaster position="top-right" richColors />
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name || 'Friend'}!</h2>
          <p className="text-blue-100">Find blood donors and blood banks near you</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Blood Donors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Location</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Latitude"
                    value={searchLocation.latitude}
                    onChange={(e) => setSearchLocation(prev => ({ ...prev, latitude: e.target.value }))}
                  />
                  <Input
                    placeholder="Longitude"
                    value={searchLocation.longitude}
                    onChange={(e) => setSearchLocation(prev => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {locationLoading ? 'Detecting...' : 'Auto Detect Location'}
                </Button>
              </div>
              <Link to="/search" state={{ location: searchLocation }}>
                <Button className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search Nearby
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                  : 'No new messages'
                }
              </p>
              <Link to="/messages">
                <Button variant="outline" className="w-full">
                  View Messages
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Inspirational Quote (stable) */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg italic text-gray-700">"{patientSelectedQuote}"</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const DonorDashboard = () => {
    const safeInitLastDonation = () => {
      try {
        if (user?.lastDonationDate) {
          const d = new Date(user.lastDonationDate);
          if (!Number.isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        }
      } catch (_) {}
      return '';
    };
    const [lastDonationInput, setLastDonationInput] = useState(safeInitLastDonation());
    const [totalDonationsInput, setTotalDonationsInput] = useState(
      typeof user?.totalDonations === 'number' ? String(user.totalDonations) : ''
    );
    const [availabilitySaving, setAvailabilitySaving] = useState(false);
    // Freeze quote so it doesn't change on every re-render
    const [donorSelectedQuote] = useState(
      quotes[Math.floor(Math.random() * quotes.length)]
    );
    
    // Donation Scheduling State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showNearbyModal, setShowNearbyModal] = useState(false);
    const [selectedBloodBank, setSelectedBloodBank] = useState(null);
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
    const [scheduleError, setScheduleError] = useState('');
    const [scheduleForm, setScheduleForm] = useState({
      donationDate: '',
      quantity: 1,
      unit: 'packets',
      notes: ''
    });
    const [bloodBanks, setBloodBanks] = useState([]);
    const [loadingNearby, setLoadingNearby] = useState(false);
    const [nearbyError, setNearbyError] = useState('');
    const [searchFilters, setSearchFilters] = useState({
      latitude: '',
      longitude: '',
      maxDistanceKm: 10,
      bloodGroup: ''
    });
    const [donations, setDonations] = useState([]);
    const [donationStats, setDonationStats] = useState({
      totalDonations: 0,
      scheduledCount: 0,
      nextScheduled: null,
      nextEligibleDate: null,
      livesImpacted: 0
    });
    
    // Load donor data on mount
    useEffect(() => {
      loadDonorData();
    }, []);
    
    // Load donations and stats
    const loadDonorData = async (updatedUserData = null) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Use passed user data or fallback to context user
        const currentUser = updatedUserData || user;
        
        // Fetch donations list
        const donationsRes = await fetch('http://localhost:5000/api/donations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (donationsRes.ok) {
          const list = await donationsRes.json();
          setDonations(Array.isArray(list) ? list : []);
        }
        
        // Fetch donation stats
        const statsRes = await fetch('http://localhost:5000/api/donations/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          // Prefer user.totalDonations over backend-calculated stats for self-reported donations
          // Backend stats are good for scheduled/completed counts, but user's profile has the authoritative total
          setDonationStats(prev => ({
            ...stats,
            totalDonations: typeof currentUser?.totalDonations === 'number' ? currentUser.totalDonations : (stats.totalDonations || prev.totalDonations || 0),
            livesImpacted: typeof currentUser?.totalDonations === 'number' ? currentUser.totalDonations * 3 : (stats.livesImpacted || prev.livesImpacted || 0),
            nextEligibleDate: (currentUser?.lastDonationDate && prev?.nextEligibleDate)
              ? prev.nextEligibleDate
              : stats.nextEligibleDate
          }));
        }
      } catch (error) {
        console.error('Error loading donor data:', error);
      }
    };
    
    // Derived donor stats (best-effort based on available fields)
    const donationCount = Number(user?.totalDonations || 0);
    const tmpLast = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
    const lastDonation = (tmpLast && !Number.isNaN(tmpLast.getTime())) ? tmpLast : null;
    const ELIGIBILITY_DAYS = 56; // standard whole blood minimum interval
    const today = new Date();
    const nextEligibleDate = lastDonation ? new Date(lastDonation.getTime() + ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000) : today;
    const daysUntilEligible = Math.max(0, Math.ceil((nextEligibleDate - today) / (1000 * 60 * 60 * 24)));
    const eligibleNow = daysUntilEligible === 0;
    // Prefer locally computed next eligible date when user provided lastDonationDate
    // Otherwise, fall back to backend-provided stats
    const uiNextEligible = lastDonation
      ? nextEligibleDate
      : (donationStats.nextEligibleDate ? new Date(donationStats.nextEligibleDate) : null);

    // Sync user.totalDonations to donationStats on user change
    useEffect(() => {
      if (user && typeof user.totalDonations === 'number') {
        setDonationStats(prev => ({
          ...prev,
          totalDonations: user.totalDonations,
          livesImpacted: user.totalDonations * 3
        }));
      }
    }, [user?.totalDonations]);

    useEffect(() => {
      try {
        const src = user?.lastDonationDate;
        if (!src) return;
        const d = new Date(src);
        if (Number.isNaN(d.getTime())) return;
        const next = new Date(d.getTime() + ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000);
        setDonationStats(prev => ({ ...prev, nextEligibleDate: next.toISOString() }));
      } catch {}
    }, [user?.lastDonationDate]);

    // Simple achievements based on milestones
    const badges = [
      { key: 'first', label: 'First Donation', unlocked: donationStats.totalDonations >= 1, colorClasses: 'bg-gradient-to-r from-amber-400 to-amber-500', icon: Trophy },
      { key: 'streak3', label: '3+ Donations', unlocked: donationStats.totalDonations >= 3, colorClasses: 'bg-gradient-to-r from-violet-400 to-violet-500', icon: Star },
      { key: 'hero5', label: '5+ Life Saver', unlocked: donationStats.totalDonations >= 5, colorClasses: 'bg-gradient-to-r from-rose-400 to-rose-500', icon: Heart },
    ];

    const formatDate = (d) => {
      try { return d?.toLocaleDateString?.('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) || '-'; } catch { return '-'; }
    };

    const startOfDay = (d) => {
      try {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      } catch { return new Date(); }
    };

    // Save donor self-reported donation info
    const saveSelfReport = async () => {
      try {
        const updates = {};
        if (lastDonationInput) updates.lastDonationDate = lastDonationInput;
        if (totalDonationsInput !== '') {
          const n = Math.max(0, parseInt(totalDonationsInput || '0', 10) || 0);
          updates.totalDonations = n;
        }
        if (Object.keys(updates).length === 0) { toast.message('Nothing to update'); return; }
        const updated = await apiClient.updateProfile(updates);
        updateUser(updated.user);
        // Optimistically update local donation stats so Eligibility UI reflects changes immediately
        try {
          const srcDate = updates.lastDonationDate || updated?.user?.lastDonationDate || null;
          let next = null;
          if (srcDate) {
            const d = new Date(srcDate);
            if (!Number.isNaN(d.getTime())) {
              next = new Date(d.getTime() + ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000);
            }
          }
          setDonationStats(prev => ({
            ...prev,
            totalDonations: typeof updates.totalDonations === 'number' ? updates.totalDonations : (updated?.user?.totalDonations || prev.totalDonations),
            nextEligibleDate: next ? next.toISOString() : prev.nextEligibleDate,
            livesImpacted: typeof updates.totalDonations === 'number' ? updates.totalDonations * 3 : (updated?.user?.totalDonations ? updated.user.totalDonations * 3 : prev.livesImpacted)
          }));
        } catch (_) { /* noop */ }
        // Also refresh from backend to stay in sync (non-blocking), pass updated user to avoid stale closure
        loadDonorData(updated.user);
        toast.success('Donation info updated');
        // Clear inputs after successful save as requested
        setLastDonationInput('');
        setTotalDonationsInput('');
      } catch (e) {
        console.error('Self-report update error:', e);
        toast.error(e?.message || 'Failed to update donation info');
      }
    };

    // Availability toggle handler
    const handleToggleAvailability = async (checked) => {
      try {
        setAvailabilitySaving(true);
        const updated = await apiClient.updateProfile({ isActive: !!checked });
        updateUser(updated.user);
        toast.success(`Availability ${checked ? 'enabled' : 'disabled'}`);
      } catch (e) {
        console.error('Availability update error:', e);
        toast.error(e?.message || 'Failed to update availability');
      } finally {
        setAvailabilitySaving(false);
      }
    };

    // Reminder helpers
    const pad = (n) => String(n).padStart(2, '0');
    const toYmd = (date) => `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`;
    const toYmdHisZ = (date) => {
      const d = new Date(date);
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const openGoogleCalendar = () => {
      try {
        const title = 'Next Eligible Blood Donation';
        const details = 'Reminder set from LifeFlow to donate blood.';
        const start = toYmd(nextEligibleDate);
        const endDate = new Date(nextEligibleDate); endDate.setDate(endDate.getDate() + 1);
        const end = toYmd(endDate);
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${start}/${end}`;
        window.open(url, '_blank', 'noopener');
      } catch (e) {
        console.error('Google Calendar link error:', e);
        toast.error('Could not open Google Calendar');
      }
    };

    const downloadICS = () => {
      try {
        const title = 'Next Eligible Blood Donation';
        const description = 'Reminder set from LifeFlow to donate blood.';
        const uid = `${Date.now()}@lifeflow`;
        const start = toYmd(nextEligibleDate);
        const endDate = new Date(nextEligibleDate); endDate.setDate(endDate.getDate() + 1);
        const end = toYmd(endDate);
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//LifeFlow//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${toYmdHisZ(new Date())}`,
          `DTSTART;VALUE=DATE:${start}`,
          `DTEND;VALUE=DATE:${end}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${description}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lifeflow-reminder.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('ICS downloaded');
      } catch (e) {
        console.error('ICS download error:', e);
        toast.error('Could not download ICS');
      }
    };

    // Fetch nearby blood banks
    const fetchNearby = async () => {
      setLoadingNearby(true);
      setNearbyError('');
      try {
        const token = localStorage.getItem('token');
        const maxDistanceKm = Number(searchFilters.maxDistanceKm);
        
        if (isNaN(maxDistanceKm) || maxDistanceKm <= 0) {
          setNearbyError('Please select a valid maximum distance.');
          setLoadingNearby(false);
          return;
        }
        
        const body = {
          latitude: Number(searchFilters.latitude),
          longitude: Number(searchFilters.longitude),
          maxDistance: Math.round(maxDistanceKm * 1000),
          bloodGroup: searchFilters.bloodGroup || undefined
        };
        if (!body.latitude || !body.longitude) {
          setNearbyError('Please set your location (use the button or fill coordinates).');
          setLoadingNearby(false);
          return;
        }
        const res = await fetch('http://localhost:5000/api/search/nearby-banks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to search nearby');
        }
        const data = await res.json();
        setBloodBanks(data.bloodBanks || []);
      } catch (err) {
        console.error('Nearby search error:', err);
        setNearbyError('Search failed. Please try again.');
      } finally {
        setLoadingNearby(false);
      }
    };

    // Use current location
    const useCurrentLocation = () => {
      if (!navigator.geolocation) { setNearbyError('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSearchFilters(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
        },
        () => setNearbyError('Could not get your location'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    // Open schedule modal
    const openScheduleModal = (bb) => {
      setSelectedBloodBank(bb);
      setScheduleError('');
      setScheduleForm({ donationDate: '', quantity: 1, unit: 'packets', notes: '' });
      setShowScheduleModal(true);
    };

    // Submit schedule
    const submitSchedule = async (e) => {
      e?.preventDefault?.();
      let donorId = user?._id || user?.id;
      const bloodBankId = selectedBloodBank?._id || selectedBloodBank?.id;
      if (!donorId) { setScheduleError('User not found in session'); return; }
      if (!bloodBankId) { setScheduleError('Please select a valid blood bank'); return; }
      if (!scheduleForm.donationDate) { setScheduleError('Please choose date and time'); return; }
      setScheduleSubmitting(true);
      setScheduleError('');
      try {
        const token = localStorage.getItem('token');
        let bloodGroup = user?.bloodGroup || user?.bloodType;
        if (!bloodGroup && token) {
          try {
            const profRes = await fetch('http://localhost:5000/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            if (profRes.ok) {
              const profile = await profRes.json();
              bloodGroup = profile?.bloodGroup || bloodGroup;
              const maybeId = profile?._id || profile?.id;
              if (maybeId && typeof maybeId === 'string' && /^[a-fA-F0-9]{24}$/.test(maybeId)) {
                donorId = maybeId;
              }
            }
          } catch {}
        }
        if (!donorId || typeof donorId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(donorId)) {
          setScheduleError('Your account identifier is invalid. Please sign out and sign in again.');
          setScheduleSubmitting(false);
          return;
        }
        if (!bloodGroup) {
          setScheduleError('Your blood group is missing from profile. Please update your profile first.');
          setScheduleSubmitting(false);
          return;
        }
        const body = {
          donorId,
          bloodBankId,
          bloodGroup,
          quantity: Number(scheduleForm.quantity) || 1,
          unit: scheduleForm.unit || 'packets',
          donationDate: new Date(scheduleForm.donationDate).toISOString(),
          notes: scheduleForm.notes || ''
        };
        const res = await fetch('http://localhost:5000/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          let msg = 'Failed to schedule donation';
          try {
            const t = await res.text();
            msg = t || msg;
          } catch {}
          throw new Error(msg);
        }
        setShowScheduleModal(false);
        setShowNearbyModal(false);
        toast.success('Donation scheduled successfully');
        // Reload donor data
        loadDonorData();
      } catch (err) {
        console.error('Schedule donation error:', err);
        const message = (err?.message || '').replace(/\"/g, '"');
        setScheduleError(message || 'Could not schedule donation. Please try again.');
      } finally {
        setScheduleSubmitting(false);
      }
    };

    // Schedule appointment helper
    const scheduleAppointment = () => {
      setShowNearbyModal(true);
    };

    // Prefill location when nearby modal opens
    useEffect(() => {
      const prefill = async () => {
        if (!showNearbyModal) return;
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const profile = await res.json();
            const coords = Array.isArray(profile?.location?.coordinates) ? profile.location.coordinates : null;
            setSearchFilters(prev => ({
              ...prev,
              latitude: (coords && typeof coords[1] === 'number') ? String(coords[1]) : (prev.latitude || ''),
              longitude: (coords && typeof coords[0] === 'number') ? String(coords[0]) : (prev.longitude || ''),
              bloodGroup: prev.bloodGroup || (profile?.bloodGroup || '')
            }));
            if (!coords) {
              useCurrentLocation();
            }
          } else {
            useCurrentLocation();
          }
        } catch {
          useCurrentLocation();
        }
      };
      prefill();
    }, [showNearbyModal]);

    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-lg p-6 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name || 'Donor'}!</h2>
            <p className="text-white/90">Every drop counts. Thanks for being a hero.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full">Blood Group: {user?.bloodGroup || 'Unknown'}</span>
              {user.age && (
                <span className="bg-white/20 px-3 py-1 rounded-full">Age: {user.age} years</span>
              )}
            </div>
          </div>
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-6 top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Stat & Eligibility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{donationStats.totalDonations}</div>
              <p className="text-sm text-gray-500">Lives impacted: ~{donationStats.livesImpacted}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-500" /> Scheduled Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{donationStats.scheduledCount}</div>
              <p className="text-sm text-gray-500">
                {donationStats.nextScheduled ? `Next: ${formatDate(new Date(donationStats.nextScheduled))}` : 'No upcoming donations'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-500" /> Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              {!uiNextEligible || startOfDay(uiNextEligible) <= startOfDay(new Date()) ? (
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-green-700">✓ You are eligible to donate now</div>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={scheduleAppointment}>Schedule Donation</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 font-medium">
                    Next eligible: <span className="text-indigo-600">{formatDate(uiNextEligible)}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(
                        lastDonation 
                          ? Math.min(100, Math.max(0, ((new Date() - lastDonation) / (nextEligibleDate - lastDonation)) * 100))
                          : 0
                      )}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ 
                          width: `${lastDonation 
                            ? Math.min(100, Math.max(0, ((new Date() - lastDonation) / (nextEligibleDate - lastDonation)) * 100))
                            : 0}%`
                        }} 
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1.5">
                      {lastDonation ? `${Math.max(0, Math.ceil((nextEligibleDate - new Date()) / (1000 * 60 * 60 * 24)))} days remaining` : 'Set your last donation date to track eligibility'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Messages
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{unreadCount}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No new messages'}
              </p>
              <Link to="/messages">
                <Button variant="outline" className="w-full">Open Inbox</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button className="w-full" variant="secondary" onClick={scheduleAppointment}>
                  <Calendar className="h-4 w-4 mr-2" /> Schedule Donation
                </Button>
                <Link to="/messages">
                  <Button className="w-full" variant="secondary"><MapPin className="h-4 w-4 mr-2" /> Find Requests</Button>
                </Link>
                <button type="button" onClick={() => navigator.share?.({ title: 'Donate Blood', text: 'Join me in saving lives!', url: window.location.origin })} className="w-full">
                  <span className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md border text-sm bg-white hover:bg-gray-50">
                    <Share2 className="h-4 w-4 mr-2" /> Share & Inspire
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Availability & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Availability & Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Available to donate</div>
                  <div className="text-xs text-gray-500">Show in donor searches when active</div>
                </div>
                <Switch
                  checked={user?.isActive !== false}
                  onCheckedChange={handleToggleAvailability}
                  disabled={availabilitySaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-full" onClick={openGoogleCalendar}>
                  <Calendar className="h-4 w-4 mr-2" /> Add to Google Calendar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-full" onClick={downloadICS}>
                  <Calendar className="h-4 w-4 mr-2" /> Download .ics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Report Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-600" /> Update Donation Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastDonationInput">Last Donation Date</Label>
                <Input
                  id="lastDonationInput"
                  type="date"
                  value={lastDonationInput}
                  onChange={(e) => setLastDonationInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalDonationsInput">Total Donations</Label>
                <Input
                  id="totalDonationsInput"
                  type="number"
                  min={0}
                  max={280}
                  value={totalDonationsInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    const num = parseInt(value, 10) || 0;
                    if (num > 280) {
                      toast.error('You cannot donate that much in your life. Please verify the information.');
                      setTotalDonationsInput(typeof user?.totalDonations === 'number' ? String(user.totalDonations) : '');
                    } else {
                      setTotalDonationsInput(value);
                    }
                  }}
                  placeholder="e.g., 18"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={saveSelfReport} disabled={parseInt(totalDonationsInput || '0', 10) > 280}>Save</Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">This information updates your profile and powers your eligibility, stats, and achievements.</p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {badges.map(({ key, label, unlocked, colorClasses, icon: BadgeIcon }) => (
                <div key={key} className={`relative overflow-hidden rounded-lg p-4 ${unlocked ? colorClasses + ' text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${unlocked ? 'bg-white/20' : 'bg-gray-200'}`}>
                      <BadgeIcon className={`h-5 w-5 ${unlocked ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs opacity-80">{unlocked ? 'Unlocked' : 'Locked'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Healthy Donor Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspirational Quote (stable) */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg italic text-gray-700">"{donorSelectedQuote}"</p>
          </CardContent>
        </Card>

        {/* Nearby Blood Banks Modal */}
        {showNearbyModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Find Nearby Blood Banks</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowNearbyModal(false)}>✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Latitude</label>
                  <Input type="number" step="any" value={searchFilters.latitude} onChange={(e)=>setSearchFilters(p=>({ ...p, latitude: e.target.value }))} />
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Longitude</label>
                  <Input type="number" step="any" value={searchFilters.longitude} onChange={(e)=>setSearchFilters(p=>({ ...p, longitude: e.target.value }))} />
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Max Distance (km)</label>
                  <Input type="number" min="1" value={searchFilters.maxDistanceKm} onChange={(e)=>setSearchFilters(p=>({ ...p, maxDistanceKm: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 mr-2">Filter by blood group (optional)</label>
                <select className="border rounded px-2 py-1 text-sm" value={searchFilters.bloodGroup} onChange={(e)=>setSearchFilters(p=>({ ...p, bloodGroup: e.target.value }))}>
                  <option value="">Any</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={useCurrentLocation}><MapPin className="h-4 w-4 mr-1"/>Use my location</Button>
                <Button size="sm" onClick={fetchNearby} disabled={loadingNearby}>{loadingNearby ? 'Searching…' : 'Search'}</Button>
              </div>
              {nearbyError && (
                <Alert className="mb-2">
                  <AlertDescription className="text-sm text-amber-600">{nearbyError}</AlertDescription>
                </Alert>
              )}
              <div className="max-h-72 overflow-y-auto border rounded">
                {bloodBanks.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No results yet. Enter your location and click Search.</div>
                ) : (
                  <ul className="divide-y">
                    {bloodBanks.map((bb, idx) => (
                      <li key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{bb.name || bb.bloodBankName || 'Blood Bank'}</div>
                          <div className="text-xs text-gray-500">{bb.address || 'Address unavailable'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {Array.isArray(bb.location?.coordinates) && bb.location.coordinates.length === 2 && (
                            <a
                              className="text-xs text-blue-600 hover:underline"
                              href={`https://www.google.com/maps?q=${bb.location.coordinates[1]},${bb.location.coordinates[0]}`}
                              target="_blank" rel="noreferrer"
                            >
                              Maps
                            </a>
                          )}
                          <Button size="sm" onClick={() => openScheduleModal(bb)}>
                            Schedule
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Donation Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Schedule Donation{selectedBloodBank ? ` at ${selectedBloodBank.bloodBankName || selectedBloodBank.name || ''}` : ''}</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowScheduleModal(false)}>✕</button>
              </div>
              {scheduleError && (
                <Alert className="mb-3">
                  <AlertDescription className="text-sm text-amber-600">{scheduleError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={submitSchedule} className="space-y-3">
                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.donationDate}
                    onChange={(e) => setScheduleForm(p => ({ ...p, donationDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={scheduleForm.quantity}
                      onChange={(e) => setScheduleForm(p => ({ ...p, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={scheduleForm.unit}
                      onChange={(e) => setScheduleForm(p => ({ ...p, unit: e.target.value }))}
                    >
                      <option value="packets">packets</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    rows="3"
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any special instructions"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={scheduleSubmitting}>
                    {scheduleSubmitting ? 'Scheduling…' : 'Schedule'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };


  const BloodBankDashboard = () => {
    const [inventory, setInventory] = useState([])
    const [donations, setDonations] = useState([])
    const [requests, setRequests] = useState([])
    const [pickups, setPickups] = useState([])
    const [showPickupModal, setShowPickupModal] = useState(false)
    const [pickupSubmitting, setPickupSubmitting] = useState(false)
    const [pickupError, setPickupError] = useState('')
    const [pickupForm, setPickupForm] = useState({ address: '', pickupTime: '', contactName: '', contactPhone: '', notes: '' })
    const [stats, setStats] = useState({ totalUnits: 0, lowStockCount: 0, todayDonations: 0, pendingRequests: 0 })
    const [activeTab, setActiveTab] = useState('inventory')
    
    const [showDonationDialog, setShowDonationDialog] = useState(false)
    const [donationForm, setDonationForm] = useState({ donorName: '', age: '', mobileNumber: '', bloodGroup: 'O+', quantity: 1 })
    const [showCsvImportDialog, setShowCsvImportDialog] = useState(false)
    const [csvFile, setCsvFile] = useState(null)
    const [csvImporting, setCsvImporting] = useState(false)
    const [csvImportResults, setCsvImportResults] = useState(null)
    const [donationSearch, setDonationSearch] = useState('')
    const [donationSearchInput, setDonationSearchInput] = useState('')
    const [donationFilterGroup, setDonationFilterGroup] = useState('')
    const [donationFilterGroupInput, setDonationFilterGroupInput] = useState('')
    const [editUnits, setEditUnits] = useState({})
    const [showBulkInventoryDialog, setShowBulkInventoryDialog] = useState(false)
    const [bulkSubmitting, setBulkSubmitting] = useState(false)
    const [showStatusDialog, setShowStatusDialog] = useState(false)
    const [statusSubmitting, setStatusSubmitting] = useState(false)
    const [statusReason, setStatusReason] = useState('')
    const [targetStatus, setTargetStatus] = useState('scheduled')
    const [targetPickup, setTargetPickup] = useState(null)

    useEffect(() => {
      fetchBloodBankData()
      fetchRequests()
      fetchPickups()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keep pending requests stat in sync with loaded requests
    useEffect(() => {
      const pendingCount = (requests || []).filter(r => r?.requestDetails?.status === 'pending').length
      setStats(prev => ({ ...prev, pendingRequests: pendingCount }))
    }, [requests])

    // Sync editable units with inventory (cover all 8 groups)
    useEffect(() => {
      const map = {}
      const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
      groups.forEach(g => { map[g] = 0 })
      inventory.forEach(i => { map[i.bloodType] = i.units || 0 })
      setEditUnits(map)
    }, [inventory])

    const fetchBloodBankData = async () => {
      try {
        // Inventory
        const stockByGroup = await apiClient.getBloodStock()
        const invArr = Object.entries(stockByGroup || {}).map(([bloodGroup, data]) => ({
          bloodType: bloodGroup,
          units: data?.quantity ?? 0,
          expiryDate: null
        }))
        setInventory(invArr)
        const totalUnits = invArr.reduce((sum, item) => sum + (item.units || 0), 0)
        const lowStockCount = invArr.filter(item => (item.units || 0) < 10).length
        setStats(prev => ({ ...prev, totalUnits, lowStockCount }))

        // Donations (best-effort)
        try {
          const list = await apiClient.request('/donations')
          setDonations(Array.isArray(list) ? list : [])
          const today = new Date().toDateString()
          const todayDonations = (Array.isArray(list) ? list : []).filter(
            d => new Date(d.donationDate || d.date).toDateString() === today
          ).length
          setStats(prev => ({ ...prev, todayDonations }))
        } catch (_) { setDonations([]) }

        // pendingRequests will be updated by fetchRequests
      } catch (e) {
        console.error('Error fetching blood bank data:', e)
      }
    }

    const fetchRequests = async () => {
      try {
        // Fetch all request messages for this bank (optionally focus on pending)
        const list = await apiClient.getIncomingRequests()
        const arr = Array.isArray(list) ? list : []
        setRequests(arr)
        const pendingCount = arr.filter(r => r?.requestDetails?.status === 'pending').length
        setStats(prev => ({ ...prev, pendingRequests: pendingCount }))
      } catch (e) {
        console.error('Error fetching requests:', e)
        setRequests([])
        setStats(prev => ({ ...prev, pendingRequests: 0 }))
      }
    }

    const updateRequestStatus = async (messageId, status) => {
      try {
        await apiClient.updateMessageStatus(messageId, status)
        toast.success(`Request ${status}`)
        await fetchRequests()
      } catch (e) {
        console.error('Update request status error:', e)
        toast.error('Could not update request status')
      }
    }

    // Build filtered donations list based on current search and group filters
    const getFilteredDonations = () => {
      const q = donationSearch.trim().toLowerCase()
      const g = donationFilterGroup
      return (donations || []).filter(d => {
        const matchesText = !q || [
          d.donorName, 
          d.donorId?.name, 
          d.notes, 
          d.mobileNumber, 
          d.age ? String(d.age) : ''
        ].some(x => (x||'').toLowerCase().includes(q))
        const matchesGroup = !g || (d.bloodGroup === g || d.bloodType === g)
        return matchesText && matchesGroup
      })
    }

    // Export current filtered list to CSV
    const exportDonationsCsv = (rows) => {
      try {
        const items = Array.isArray(rows) ? rows : []
        if (items.length === 0) { toast.message('No donations to export'); return }
        const headers = ['donorName','age','mobileNumber','bloodGroup','quantity','unit','donationDate','notes']
        const escape = (val) => {
          const s = (val ?? '').toString()
          const needsQuotes = /[",\n]/.test(s)
          const escaped = s.replace(/"/g, '""')
          return needsQuotes ? `"${escaped}"` : escaped
        }
        const lines = []
        lines.push(headers.join(','))
        for (const d of items) {
          const donorAge = d.age || '';
          const donorPhone = d.mobileNumber || '';
          const row = [
            escape(d.donorName || d.donorId?.name || ''),
            escape(donorAge),
            escape(donorPhone),
            escape(d.bloodGroup || d.bloodType || ''),
            escape(d.quantity ?? d.amount ?? ''),
            escape(d.unit || 'packets'),
            escape(new Date(d.donationDate || d.date || d.createdAt || Date.now()).toISOString()),
            escape(d.notes || ''),
          ]
          lines.push(row.join(','))
        }
        const csv = '\uFEFF' + lines.join('\n') // Add BOM for Excel (Windows)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const ts = new Date()
        const pad = (n)=> String(n).padStart(2,'0')
        const fname = `donations_${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}.csv`
        a.href = url
        a.download = fname
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Export started')
      } catch (err) {
        console.error('Export CSV failed', err)
        toast.error('Could not export CSV')
      }
    }

    // Download CSV template
    const downloadCsvTemplate = () => {
      const headers = ['donorName', 'age', 'mobileNumber', 'bloodGroup', 'quantity']
      const sampleData = [
        ['John Doe', '25', '9876543210', 'O+', '2'],
        ['Jane Smith', '30', '8765432109', 'A+', '1'],
        ['Bob Johnson', '45', '7654321098', 'B+', '1']
      ]
      
      const csvContent = [
        headers.join(','),
        ...sampleData.map(row => row.join(','))
      ].join('\n')
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'donations_template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Template downloaded')
    }

    // Import donations from CSV
    const handleCsvImport = async () => {
      if (!csvFile) { toast.error('Please select a CSV file'); return }
      
      setCsvImporting(true)
      setCsvImportResults(null)
      
      try {
        const text = await csvFile.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error('CSV file is empty or has no data rows')
          setCsvImporting(false)
          return
        }
        
        // Parse CSV
        const parseCsvLine = (line) => {
          const result = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
              } else {
                inQuotes = !inQuotes
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }
        
        const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
        const donorNameIdx = headers.indexOf('donorname')
        const ageIdx = headers.indexOf('age')
        const mobileIdx = headers.indexOf('mobilenumber') >= 0 ? headers.indexOf('mobilenumber') : headers.indexOf('mobile')
        const bloodGroupIdx = headers.indexOf('bloodgroup')
        const quantityIdx = headers.indexOf('quantity')
        
        if (donorNameIdx < 0 || bloodGroupIdx < 0 || quantityIdx < 0) {
          toast.error('CSV must have columns: donorName, bloodGroup, quantity (age and mobileNumber are optional)')
          setCsvImporting(false)
          return
        }
        
        const donations = []
        const errors = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i])
          if (values.length < headers.length || !values[donorNameIdx]?.trim()) continue
          
          const donorName = values[donorNameIdx].trim()
          const age = ageIdx >= 0 && values[ageIdx] ? Number(values[ageIdx]) : undefined
          const mobileNumber = mobileIdx >= 0 ? values[mobileIdx]?.trim() : ''
          const bloodGroup = values[bloodGroupIdx]?.trim()
          const quantity = Number(values[quantityIdx])
          
          // Validate
          if (!donorName) {
            errors.push(`Row ${i + 1}: Donor name is required`)
            continue
          }
          if (!['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(bloodGroup)) {
            errors.push(`Row ${i + 1}: Invalid blood group "${bloodGroup}"`)
            continue
          }
          if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push(`Row ${i + 1}: Invalid quantity "${quantity}"`)
            continue
          }
          if (age !== undefined && (!Number.isFinite(age) || age < 16 || age > 65)) {
            errors.push(`Row ${i + 1}: Age must be between 16 and 65`)
            continue
          }
          if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
            errors.push(`Row ${i + 1}: Mobile number must be 10 digits starting with 6-9`)
            continue
          }
          
          donations.push({ donorName, age, mobileNumber, bloodGroup, quantity })
        }
        
        if (donations.length === 0) {
          toast.error('No valid donations found in CSV')
          setCsvImportResults({ success: 0, failed: errors.length, errors })
          setCsvImporting(false)
          return
        }
        
        // Send bulk donations to backend
        const results = await apiClient.request('/donations/bulk', {
          method: 'POST',
          body: { donations, bloodBankId: user?.id || user?._id }
        })
        
        toast.success(`Successfully imported ${results.successCount} donations`)
        setCsvImportResults({
          success: results.successCount,
          failed: results.failedCount + errors.length,
          errors: [...errors, ...(results.errors || [])]
        })
        
        await fetchBloodBankData()
        setCsvFile(null)
      } catch (error) {
        console.error('CSV import error:', error)
        toast.error(error.message || 'Failed to import CSV')
      } finally {
        setCsvImporting(false)
      }
    }

    const updatePickupStatus = async (pickupId, status, reason='') => {
      try {
        await apiClient.request(`/pickups/${pickupId}/status`, { method: 'PUT', body: { status, reason } })
        toast.success(`Pickup marked as ${status.replace('_',' ')}`)
        await fetchPickups()
      } catch (e) { console.error('Update pickup status error:', e); toast.error('Could not update pickup status') }
    }

    const openStatusDialog = (pickup, status) => {
      // For 'completed', do not ask for a reason; update immediately
      if (status === 'completed') {
        updatePickupStatus(pickup._id || pickup.id, 'completed')
        return
      }
      setTargetPickup(pickup)
      setTargetStatus(status)
      setStatusReason('')
      setShowStatusDialog(true)
    }

    const fetchPickups = async () => {
      try { const list = await apiClient.request('/pickups'); setPickups(Array.isArray(list) ? list : []) }
      catch (e) { console.error('Fetch pickups error:', e); setPickups([]) }
    }

    const updateInventory = async (bloodType, newUnits) => {
      try {
        const qty = Number(newUnits)
        if (!Number.isFinite(qty) || qty < 0) { toast.error('Please enter a valid non-negative number'); return }
        await apiClient.updateBloodStock(encodeURIComponent(bloodType), { quantity: qty, unit: 'packets' })
        toast.success(`Inventory updated for ${bloodType}`)
        fetchBloodBankData()
      } catch (e) { console.error('Error updating inventory:', e); toast.error('Failed to update inventory') }
    }

    const handleQuickAddInventory = () => {
      // Open Bulk Inventory dialog (no browser prompts)
      setShowBulkInventoryDialog(true)
    }

    const submitBulkInventory = async (e) => {
      e?.preventDefault?.()
      try {
        setBulkSubmitting(true)
        // Build payload: { A+: {quantity, unit}, ... }
        const payload = {}
        Object.entries(editUnits).forEach(([bg, qty]) => {
          const n = Number(qty)
          if (Number.isFinite(n) && n >= 0) {
            payload[bg] = { quantity: n, unit: 'packets' }
          }
        })
        if (Object.keys(payload).length === 0) {
          toast.error('Please enter at least one valid quantity')
          return
        }
        await apiClient.bulkUpdateBloodStock(payload)
        toast.success('Inventory updated')
        setShowBulkInventoryDialog(false)
        fetchBloodBankData()
      } catch (err) {
        console.error('Bulk inventory update error:', err)
        toast.error('Failed to update inventory')
      } finally { setBulkSubmitting(false) }
    }

    const handleRecordDonation = () => setShowDonationDialog(true)
    const submitDonation = async (e) => {
      e?.preventDefault?.()
      try {
        const quantity = Number(donationForm.quantity)
        const donorNameTrim = donationForm.donorName.trim()
        const age = donationForm.age ? Number(donationForm.age) : undefined
        const mobileNumber = donationForm.mobileNumber.trim()
        
        if (!donorNameTrim) { toast.error('Donor Name is required'); return }
        if (!donationForm.bloodGroup.trim()) { toast.error('Blood group is required'); return }
        if (!Number.isFinite(quantity) || quantity <= 0) { toast.error('Enter a valid positive quantity'); return }
        if (age !== undefined && (!Number.isFinite(age) || age < 16 || age > 65)) { toast.error('Enter a valid age between 16 and 65'); return }
        if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) { toast.error('Mobile number must be 10 digits and start with 6, 7, 8, or 9'); return }
        
        const body = { 
          donorName: donorNameTrim, 
          bloodBankId: user?.id || user?._id, 
          bloodGroup: donationForm.bloodGroup, 
          quantity 
        }
        if (age) body.age = age
        if (mobileNumber) body.mobileNumber = mobileNumber
        
        await apiClient.request('/donations', { method: 'POST', body })
        toast.success('Donation recorded successfully')
        setShowDonationDialog(false)
        setDonationForm({ donorName: '', age: '', mobileNumber: '', bloodGroup: 'O+', quantity: 1 })
        fetchBloodBankData()
      } catch (e2) { 
        console.error('Record donation error:', e2)
        const errorMsg = e2?.message || 'Could not record donation'
        if (errorMsg.includes('Duplicate donation')) {
          toast.error('⚠️ ' + errorMsg)
        } else {
          toast.error(errorMsg)
        }
      }
    }

    const handleSchedulePickup = () => setShowPickupModal(true)
    const handleViewReports = () => setActiveTab('reports')

    const formatDate = (dateString) => {
      try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
      catch { return String(dateString) }
    }

    const formatDuration = (seconds) => { const s = Number(seconds)||0; const hours = Math.floor(s / 3600); const minutes = Math.floor((s % 3600) / 60); return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m` }
    const formatDistance = (meters) => { const m = Number(meters)||0; const km = m / 1000; return km > 1 ? `${km.toFixed(1)} km` : `${m.toFixed(0)} m` }

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    const completeInventory = bloodTypes.map(type => inventory.find(item => item.bloodType === type) || { bloodType: type, units: 0, expiryDate: null })

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.bloodBankName || user?.name || 'Blood Bank'}!</h2>
          <p className="text-green-100">Manage your blood inventory and help patients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUnits}</div>
                <div className="text-sm text-gray-500">Total Units</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</div>
                <div className="text-sm text-gray-500">Low Stock Items</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.todayDonations}</div>
                <div className="text-sm text-gray-500">Today's Donations</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-500">Pending Requests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button onClick={() => setActiveTab('inventory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'inventory' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Package className="h-4 w-4 inline mr-2" />Inventory
              </button>
              <button onClick={() => setActiveTab('donations')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'donations' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Users className="h-4 w-4 inline mr-2" />Donations
              </button>
              <button onClick={() => setActiveTab('requests')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Bell className="h-4 w-4 inline mr-2" />Requests
              </button>
              <button onClick={() => setActiveTab('reports')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <TrendingUp className="h-4 w-4 inline mr-2" />Reports
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'inventory' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Blood Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {completeInventory.map((item, index) => {
                    const getStockLevel = (units) => { if (units < 5) return { level: 'Critical', color: 'text-red-700 bg-red-100' }; if (units < 10) return { level: 'Low', color: 'text-orange-600 bg-orange-100' }; if (units < 20) return { level: 'Medium', color: 'text-yellow-700 bg-yellow-100' }; return { level: 'Good', color: 'text-green-700 bg-green-100' } }
                    const stockInfo = getStockLevel(item.units)
                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xl font-bold text-gray-900">{item.bloodType}</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>{stockInfo.level}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-sm text-gray-500 mb-1">Units Available</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={editUnits[item.bloodType] ?? item.units ?? 0}
                              onFocus={(e) => { if (Number(e.target.value) === 0) { setEditUnits(prev => ({ ...prev, [item.bloodType]: '' })); } }}
                              onChange={(e)=> setEditUnits(prev => ({ ...prev, [item.bloodType]: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                              onBlur={(e)=> { if (e.target.value === '') setEditUnits(prev => ({ ...prev, [item.bloodType]: 0 })); }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <button
                              onClick={() => updateInventory(item.bloodType, Number(editUnits[item.bloodType] ?? item.units ?? 0))}
                              className="px-3 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                            >Save</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics & Reports</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Inventory by Blood Group</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bloodType" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="units" name="Units" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Donations by Day</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(() => { const byDay = {}; donations.forEach(d => { const dt = new Date(d.donationDate || d.date); const key = dt.toISOString().slice(0,10); byDay[key] = (byDay[key] || 0) + (d.quantity || 1) }); return Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b)).map(([date, qty]) => ({ date, qty })).slice(-14) })()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="qty" name="Quantity" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-3">Donations by Blood Group</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" nameKey="name" data={(() => { const map = {}; donations.forEach(d => { const g = d.bloodGroup || d.bloodType || 'Unknown'; map[g] = (map[g] || 0) + (d.quantity || 1) }); return Object.entries(map).map(([name, value]) => ({ name, value })) })()} cx="50%" cy="50%" outerRadius={100} label>
                            {(() => { const colors = ['#fecaca','#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#7f1d1d','#991b1b']; const dataLen = (() => { const map = {}; donations.forEach(d => { const g = d.bloodGroup || d.bloodType || 'Unknown'; map[g] = (map[g] || 0) + (d.quantity || 1) }); return Object.keys(map).length })(); return Array.from({ length: dataLen }).map((_, i) => (<Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)) })()}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'donations' && (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Donations</h3>
                      <p className="text-sm text-gray-500">Search and filter recorded donations</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        value={donationSearchInput}
                        onChange={(e)=>setDonationSearchInput(e.target.value)}
                        onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); setDonationSearch(donationSearchInput); setDonationFilterGroup(donationFilterGroupInput); } }}
                        className="flex-1 md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Search donor name, mobile, age, notes"
                      />
                      <select
                        value={donationFilterGroupInput}
                        onChange={(e)=>setDonationFilterGroupInput(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {['','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                          <option key={bg} value={bg}>{bg || 'All groups'}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={()=>{ setDonationSearch(donationSearchInput); setDonationFilterGroup(donationFilterGroupInput); }}
                        className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                      >
                        Search
                      </button>
                      <button
                        type="button"
                        onClick={() => exportDonationsCsv(getFilteredDonations())}
                        disabled={getFilteredDonations().length === 0}
                        className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCsvImportDialog(true)}
                        className="px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        Import CSV
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const list = getFilteredDonations()
                  return list.length > 0 ? (
                    <div className="space-y-4">
                      {list.map((donation, index) => {
                        const donorAge = donation.age || null;
                        const donorPhone = donation.mobileNumber || null;
                        return (
                          <div key={donation._id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">{donation.donorName || donation.donorId?.name || 'Unknown Donor'}</div>
                                  <div className="text-sm text-gray-500">{(donation.bloodType || donation.bloodGroup)} • {donation.amount || `${donation.quantity || 1} packet(s)`}</div>
                                  <div className="text-sm text-gray-500">
                                    {donorAge && <span>Age: {donorAge} years</span>}
                                    {donorAge && donorPhone && <span> • </span>}
                                    {donorPhone && <span>Mobile: {donorPhone}</span>}
                                  </div>
                                  <div className="text-sm text-gray-500">{formatDate(donation.date || donation.donationDate || donation.createdAt)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-green-600">Completed</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No donations found</p>
                    </div>
                  )
                })()}
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Blood Requests</h3>
                  <button onClick={fetchRequests} className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm">
                    <RefreshCw className="h-4 w-4 mr-2" />Refresh
                  </button>
                </div>
                {requests && requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((req, idx) => (
                      <div key={req._id || idx} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <Heart className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{req?.senderId?.name || 'Patient'}</div>
                              <div className="text-sm text-gray-600">
                                {req?.requestDetails?.bloodGroup} • {req?.requestDetails?.quantity || 1} packet(s) • {req?.requestDetails?.urgency || 'medium'}
                              </div>
                              <div className="text-xs text-gray-500">Requested on {formatDate(req?.createdAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                              req?.requestDetails?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              req?.requestDetails?.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              req?.requestDetails?.status === 'rejected' ? 'bg-gray-200 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {req?.requestDetails?.status || 'pending'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            disabled={req?.requestDetails?.status !== 'pending'}
                            onClick={() => updateRequestStatus(req._id, 'accepted')}
                            className={`text-xs px-3 py-1 rounded ${req?.requestDetails?.status !== 'pending' ? 'bg-green-200 text-white/70 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          >Accept</button>
                          <button
                            disabled={req?.requestDetails?.status !== 'pending'}
                            onClick={() => updateRequestStatus(req._id, 'rejected')}
                            className={`text-xs px-3 py-1 rounded ${req?.requestDetails?.status !== 'pending' ? 'bg-gray-300 text-white/70 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
                          >Reject</button>
                          <button
                            disabled={req?.requestDetails?.status !== 'accepted'}
                            onClick={() => updateRequestStatus(req._id, 'completed')}
                            className={`text-xs px-3 py-1 rounded ${req?.requestDetails?.status !== 'accepted' ? 'bg-blue-200 text-white/70 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >Mark Completed</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No blood requests yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Pickups */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Pickups</h3>
            {pickups && pickups.length > 0 ? (
              <div className="space-y-4">
              {pickups.map((p) => (
                <div key={p._id || p.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{p.address}</div>
                      <div className="text-sm text-gray-500">{formatDate(p.pickupTime)} • {p.contactName} • {p.contactPhone}</div>
                      {p.statusReason && (
                        <div className="text-xs text-gray-600 mt-1">Reason: {p.statusReason}</div>
                      )}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full capitalize bg-red-100 text-red-700`}>
                      {p.status || 'scheduled'}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      const s = p.status || 'scheduled';
                      const isDisabled = (btn) => {
                        if (s === 'scheduled') {
                          // After scheduling, allow all next actions except scheduled
                          return false; // enable in_transit/completed/cancelled
                        }
                        if (s === 'in_transit') {
                          // Allow move to completed or cancel only; disable in_transit
                          return btn === 'in_transit' ? true : (btn === 'completed' || btn === 'cancelled') ? false : true;
                        }
                        // completed or cancelled: disable all
                        return true;
                      };
                      return (
                        <>
                          <button disabled={isDisabled('in_transit')} onClick={() => openStatusDialog(p, 'in_transit')} className={`text-xs px-3 py-1 rounded ${isDisabled('in_transit') ? 'bg-red-200 text-white/70 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}>Mark In Transit</button>
                          <button disabled={isDisabled('completed')} onClick={() => openStatusDialog(p, 'completed')} className={`text-xs px-3 py-1 rounded ${isDisabled('completed') ? 'bg-green-200 text-white/70 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}>Mark Completed</button>
                          <button disabled={isDisabled('cancelled')} onClick={() => openStatusDialog(p, 'cancelled')} className={`text-xs px-3 py-1 rounded ${isDisabled('cancelled') ? 'bg-gray-300 text-white/70 cursor-not-allowed' : 'bg-gray-500 text-white hover:bg-gray-600'}`}>Cancel</button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pickups scheduled yet</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={handleQuickAddInventory} className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Package className="h-5 w-5 mr-2" />Add Inventory
            </button>
            <button onClick={() => setShowPickupModal(true)} className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Calendar className="h-5 w-5 mr-2" />Schedule Pickup
            </button>
            <button onClick={handleViewReports} className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <TrendingUp className="h-5 w-5 mr-2" />View Reports
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button onClick={handleRecordDonation} className="flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Users className="h-5 w-5 mr-2" />Record Donation
            </button>
            <button onClick={() => setActiveTab('donations')} className="flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              View Donations
            </button>
          </div>
          
        </div>

        

        {/* Schedule Pickup - Dialog */}
        <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Pickup</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
                e.preventDefault();
                setPickupSubmitting(true);
                try {
                  setPickupError('')
                  if (!pickupForm.address.trim()) { setPickupError('Address is required'); setPickupSubmitting(false); return }
                  if (!pickupForm.pickupTime) { setPickupError('Pickup time is required'); setPickupSubmitting(false); return }
                  const when = new Date(pickupForm.pickupTime); if (Number.isNaN(when.getTime())) { setPickupError('Pickup time is invalid'); setPickupSubmitting(false); return }
                  const now = new Date(); if (when.getTime() < now.getTime() - 60_000) { setPickupError('Pickup time must be in the future'); setPickupSubmitting(false); return }
                  if (!pickupForm.contactName.trim()) { setPickupError('Contact name is required'); setPickupSubmitting(false); return }
                  if (!pickupForm.contactPhone.trim()) { setPickupError('Contact phone is required'); setPickupSubmitting(false); return }
                  const body = { address: pickupForm.address, pickupTime: new Date(pickupForm.pickupTime).toISOString(), contactName: pickupForm.contactName, contactPhone: pickupForm.contactPhone, notes: pickupForm.notes }
                  const res = await apiClient.request('/pickups', { method: 'POST', body })
                  if (!res) throw new Error('Failed to schedule pickup')
                  setShowPickupModal(false)
                  setPickupForm({ address: '', pickupTime: '', contactName: '', contactPhone: '', notes: '' })
                  await fetchPickups()
                  toast.success('Pickup scheduled')
                } catch (err) {
                  console.error('Schedule pickup error:', err)
                  if (!pickupError) setPickupError('Could not schedule pickup. Please check details and try again.')
                } finally { setPickupSubmitting(false) }
              }} className="space-y-4">
                {pickupError && (<div className="p-2 rounded border border-red-200 bg-red-50 text-sm text-red-700">{pickupError}</div>)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" value={pickupForm.address} onChange={(e) => setPickupForm(prev => ({ ...prev, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter pickup address" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                  <input type="datetime-local" value={pickupForm.pickupTime} onChange={(e) => setPickupForm(prev => ({ ...prev, pickupTime: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                    <input type="text" value={pickupForm.contactName} onChange={(e) => setPickupForm(prev => ({ ...prev, contactName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input type="tel" value={pickupForm.contactPhone} onChange={(e) => setPickupForm(prev => ({ ...prev, contactPhone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                  <input type="text" value={pickupForm.notes} onChange={(e) => setPickupForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Any special instructions" />
                </div>
                <DialogFooter>
                  <button type="button" onClick={() => setShowPickupModal(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={pickupSubmitting} className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">{pickupSubmitting ? 'Scheduling…' : 'Schedule Pickup'}</button>
                </DialogFooter>
              </form>
          </DialogContent>
        </Dialog>

        {/* Pickup Status Reason - Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm status change</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e)=>{ e.preventDefault(); if (!targetPickup) return; setStatusSubmitting(true); try { await updatePickupStatus(targetPickup._id || targetPickup.id, targetStatus, statusReason); setShowStatusDialog(false); } finally { setStatusSubmitting(false) } }} className="space-y-4">
              <div className="text-sm text-gray-700">Set status to <span className="font-medium">{targetStatus.replace('_',' ')}</span> for <span className="font-medium">{targetPickup?.address || ''}</span></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <input type="text" value={statusReason} onChange={(e)=>setStatusReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter reason (e.g., delay, customer request, cancelled by donor)" />
              </div>
              <DialogFooter>
                <button type="button" onClick={()=>setShowStatusDialog(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={statusSubmitting} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{statusSubmitting ? 'Saving…' : 'Confirm'}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Record Donation - Dialog */}
        <Dialog open={showDonationDialog} onOpenChange={setShowDonationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Donation</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitDonation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donor Name</label>
                <input type="text" value={donationForm.donorName} onChange={(e)=>setDonationForm(prev=>({...prev, donorName: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter donor full name" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input type="number" min={16} max={65} value={donationForm.age} onChange={(e)=>setDonationForm(prev=>({...prev, age: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter age" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input type="tel" pattern="[0-9]{10}" maxLength={10} value={donationForm.mobileNumber} onChange={(e)=>setDonationForm(prev=>({...prev, mobileNumber: e.target.value.replace(/[^0-9]/g, '')}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter mobile (e.g., 9876543210)" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select value={donationForm.bloodGroup} onChange={(e)=>setDonationForm(prev=>({...prev, bloodGroup: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg=> <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (packets)</label>
                  <input type="number" min={1} value={donationForm.quantity} onChange={(e)=>setDonationForm(prev=>({...prev, quantity: Math.max(1, Number(e.target.value))}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
              </div>
              <DialogFooter>
                <button type="button" onClick={()=>setShowDonationDialog(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Record</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* CSV Import - Dialog */}
        <Dialog open={showCsvImportDialog} onOpenChange={setShowCsvImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Donations from CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">CSV Format Requirements:</h4>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Download Template
                  </button>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Required columns:</strong> donorName, bloodGroup, quantity</li>
                  <li>• <strong>Optional columns:</strong> age, mobileNumber (or mobile)</li>
                  <li>• Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-</li>
                  <li>• Age must be between 16 and 65 years</li>
                  <li>• Mobile must be 10 digits starting with 6, 7, 8, or 9</li>
                  <li>• <strong className="text-orange-700">⚠️ Duplicates prevented:</strong> Same donor (name + mobile) cannot donate twice on the same day</li>
                </ul>
                <div className="mt-3">
                  <strong className="text-sm text-blue-900">Example CSV:</strong>
                  <pre className="text-xs bg-white p-2 rounded mt-1 border border-blue-200">
donorName,age,mobileNumber,bloodGroup,quantity{'\n'}
John Doe,25,9876543210,O+,2{'\n'}
Jane Smith,30,8765432109,A+,1
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setCsvFile(e.target.files?.[0] || null)
                    setCsvImportResults(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {csvFile && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {csvFile.name}</p>
                )}
              </div>

              {csvImportResults && (
                <div className={`border rounded-md p-4 ${csvImportResults.success > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h4 className="font-medium mb-2">Import Results:</h4>
                  <p className="text-sm">✅ Successfully imported: {csvImportResults.success}</p>
                  <p className="text-sm">❌ Failed: {csvImportResults.failed}</p>
                  {csvImportResults.errors && csvImportResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-xs mt-1 max-h-32 overflow-y-auto">
                        {csvImportResults.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx} className="text-red-700">• {err}</li>
                        ))}
                        {csvImportResults.errors.length > 10 && (
                          <li className="text-red-700">... and {csvImportResults.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <button 
                type="button" 
                onClick={() => {
                  setShowCsvImportDialog(false)
                  setCsvFile(null)
                  setCsvImportResults(null)
                }} 
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={handleCsvImport}
                disabled={!csvFile || csvImporting}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {csvImporting ? 'Importing...' : 'Import'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Inventory - Dialog */}
        <Dialog open={showBulkInventoryDialog} onOpenChange={setShowBulkInventoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Inventory</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitBulkInventory} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                  <div key={bg} className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2">{bg}</div>
                    <input
                      type="number"
                      min={0}
                      value={editUnits[bg] ?? 0}
                      onFocus={(e) => { if (Number(e.target.value) === 0) { setEditUnits(prev => ({ ...prev, [bg]: '' })); } }}
                      onChange={(e)=> setEditUnits(prev => ({ ...prev, [bg]: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                      onBlur={(e)=> { if (e.target.value === '') setEditUnits(prev => ({ ...prev, [bg]: 0 })); }}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <button type="button" onClick={()=>setShowBulkInventoryDialog(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={bulkSubmitting} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{bulkSubmitting ? 'Saving…' : 'Save All'}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const userType = String(user?.userType || '').toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" richColors />
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userType === 'patient' && <PatientDashboard />}
      {userType === 'donor' && <DonorDashboard />}
      {userType === 'bloodbank' && <BloodBankDashboard />}
      {userType !== 'patient' && userType !== 'donor' && userType !== 'bloodbank' && (
        <Card>
          <CardHeader>
            <CardTitle>Unknown role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">Your account type "{String(user?.userType)}" is not recognized. Please re-login or contact support.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
