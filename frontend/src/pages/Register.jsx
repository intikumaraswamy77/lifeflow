import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getCurrentLocation, bloodGroups, validatePassword } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { MapPin, Eye, EyeOff, Heart, Shield, CheckCircle2, AlertTriangle, Calendar, Activity, Droplets, Loader2 } from 'lucide-react';
import apiClient from '../lib/api';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, logout, user } = useAuth();
  const [justRegistered, setJustRegistered] = useState(false);
  
  const [userType, setUserType] = useState(searchParams.get('type') || 'patient');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Donor specific
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    // Blood bank specific
    bloodBankName: '',
    landlineNumber: '',
    // Location
    latitude: '',
    longitude: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  // Donor eligibility token from backend
  const [eligibilityToken, setEligibilityToken] = useState('');
  const [hasEligibilityToken, setHasEligibilityToken] = useState(false);
  
  // Eligibility form state
  const [showEligibilityForm, setShowEligibilityForm] = useState(false);
  const [eligibilityForm, setEligibilityForm] = useState({
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
  });
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');


  useEffect(() => {
    // If the user is already logged in and came to Register, send to dashboard,
    // but skip this right after a fresh registration so we can route to /eligibility for donors.
    if (user && !justRegistered) {
      navigate('/dashboard');
    }
  }, [user, navigate, justRegistered]);

  // Show eligibility form when donor type is selected and no token exists
  useEffect(() => {
    if (userType === 'donor' && !hasEligibilityToken) {
      setShowEligibilityForm(true);
    } else {
      setShowEligibilityForm(false);
    }
  }, [userType, hasEligibilityToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load eligibility token from localStorage for donors
  useEffect(() => {
    if (userType !== 'donor') {
      setHasEligibilityToken(true); // Non-donors don't need token
      setEligibilityToken('');
      return;
    }

    // Check for eligibility token
    const token = localStorage.getItem('eligibilityToken');
    const storedData = localStorage.getItem('eligibilityData');

    if (token) {
      setEligibilityToken(token);
      setHasEligibilityToken(true);

      // Prefill donor form with eligibility data if available
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setFormData(prev => ({
            ...prev,
            dateOfBirth: prev.dateOfBirth || data.dateOfBirth || '',
            gender: prev.gender || data.gender || '',
          }));
        } catch (e) {
          console.error('Failed to parse eligibility data:', e);
        }
      }
    } else {
      setHasEligibilityToken(false);
      setEligibilityToken('');
    }
  }, [userType]);

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEligibilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEligibilityForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEligibilitySelectChange = (name, value) => {
    setEligibilityForm(prev => ({ ...prev, [name]: value }));
  };

  const computeAge = (dobStr) => {
    if (!dobStr) return null;
    const today = new Date();
    const dob = new Date(dobStr);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const eligibilityAssessment = useMemo(() => {
    const reasons = [];
    let eligible = true;

    const age = computeAge(eligibilityForm.dateOfBirth);
    if (age === null) {
      eligible = false;
      reasons.push('Please provide your date of birth to calculate age');
    } else if (age < 18 || age > 65) {
      eligible = false;
      reasons.push('Age must be between 18 and 65 years');
    }

    const weight = Number(eligibilityForm.weight);
    if (!weight) {
      eligible = false;
      reasons.push('Please enter your weight');
    } else if (weight < 50) {
      eligible = false;
      reasons.push('Minimum weight for donation is 50 kg');
    }

    const hb = Number(eligibilityForm.hemoglobin);
    if (!hb) {
      eligible = false;
      reasons.push('Please enter your hemoglobin');
    } else if (hb < 12.5) {
      eligible = false;
      reasons.push('Hemoglobin must be at least 12.5 g/dL');
    }

    if (eligibilityForm.lastDonationDate) {
      const last = new Date(eligibilityForm.lastDonationDate);
      const now = new Date();
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        eligible = false;
        reasons.push('At least 90 days must have passed since your last whole blood donation');
      }
    }

    if (eligibilityForm.hadFever) { eligible = false; reasons.push('You currently report fever/active infection'); }
    if (eligibilityForm.recentSurgery) { eligible = false; reasons.push('Recent major surgery requires deferral'); }
    if (eligibilityForm.onMedications) { reasons.push('Some medications may defer donation—confirm with staff'); }
    if (eligibilityForm.alcoholLast24h) { eligible = false; reasons.push('Avoid alcohol 24 hours prior to donation'); }
    if (eligibilityForm.gender === 'female' && eligibilityForm.pregnantOrBreastfeeding) { eligible = false; reasons.push('Cannot donate while pregnant or breastfeeding'); }

    return { eligible, reasons };
  }, [eligibilityForm]);

  const handleEligibilitySubmit = async () => {
    if (!eligibilityAssessment.eligible) return;

    setEligibilityLoading(true);
    setEligibilityError('');

    try {
      const response = await apiClient.checkEligibility(eligibilityForm);

      if (response.eligible && response.eligibilityToken) {
        // Store eligibility token
        localStorage.setItem('eligibilityToken', response.eligibilityToken);
        localStorage.setItem('eligibilityData', JSON.stringify(response.eligibilityData));
        setEligibilityToken(response.eligibilityToken);
        setHasEligibilityToken(true);
        setShowEligibilityForm(false);
        
        // Prefill registration form with eligibility data
        setFormData(prev => ({
          ...prev,
          dateOfBirth: eligibilityForm.dateOfBirth,
          gender: eligibilityForm.gender,
        }));
      } else {
        setEligibilityError(response.message || 'Eligibility check failed');
      }
    } catch (err) {
      setEligibilityError(err.message || 'Failed to verify eligibility. Please try again.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString()
      }));
    } catch (error) {
      setError(error.message || 'Failed to detect location. Please enter manually or check location permissions.');
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }
    
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      return 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
    }
    
    if (!formData.password) {
      return 'Password is required';
    }
    
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      return passwordErrors[0];
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    // User type specific validation
    if (userType === 'donor') {
      if (!hasEligibilityToken) return 'Please complete the eligibility check before registration';
      if (!formData.dateOfBirth) return 'Date of birth is required';
      if (!formData.gender) return 'Gender is required';
      if (!formData.bloodGroup) return 'Blood group is required';
      if (!formData.address.trim()) return 'Address is required';
      if (!formData.latitude || !formData.longitude) return 'Location is required';
    }
    
    if (userType === 'bloodbank') {
      if (!formData.bloodBankName.trim()) return 'Blood bank name is required';
      if (!formData.landlineNumber.trim()) return 'Landline number is required';
      if (formData.landlineNumber.trim() && formData.landlineNumber.trim().length < 6) {
        return 'Landline number must be at least 6 characters';
      }
      if (!formData.address.trim()) return 'Address is required';
      if (!formData.latitude || !formData.longitude) return 'Location is required';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    try {
      const registrationData = {
        userType,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      };

      // Add user type specific fields
      if (userType === 'donor') {
        registrationData.dateOfBirth = formData.dateOfBirth;
        registrationData.gender = formData.gender;
        registrationData.bloodGroup = formData.bloodGroup;
        registrationData.address = formData.address.trim();
        // Send as separate fields - backend will convert to GeoJSON
        registrationData.latitude = parseFloat(formData.latitude);
        registrationData.longitude = parseFloat(formData.longitude);
        // Include eligibility token for backend verification
        registrationData.eligibilityToken = eligibilityToken;
      }
      
      if (userType === 'bloodbank') {
        registrationData.bloodBankName = formData.bloodBankName.trim();
        if (formData.landlineNumber.trim()) {
          registrationData.landlineNumber = formData.landlineNumber.trim();
        }
        registrationData.address = formData.address.trim();
        // Send as separate fields - backend will convert to GeoJSON
        registrationData.latitude = parseFloat(formData.latitude);
        registrationData.longitude = parseFloat(formData.longitude);
      }

      await register(registrationData);
      setJustRegistered(true);
      
      // Clear eligibility data after successful registration
      if (userType === 'donor') {
        localStorage.removeItem('eligibilityToken');
        localStorage.removeItem('eligibilityData');
      }
      
      // Logout the user so they must manually login
      logout();
      
      // After successful registration, redirect all users to login page
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please login to continue.',
          userType: userType 
        } 
      });
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {showEligibilityForm ? <Shield className="h-8 w-8 text-red-600" /> : <Heart className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {showEligibilityForm ? 'Donor Eligibility Check' : 'Create Account'}
          </CardTitle>
          <p className="text-gray-600">
            {showEligibilityForm 
              ? 'Complete this eligibility check to proceed with donor registration'
              : 'Join LifeFlow and start saving lives'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Show Eligibility Form for Donors */}
          {showEligibilityForm && userType === 'donor' ? (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  This quick self-check helps determine if you meet common donation guidelines. Final eligibility is assessed by medical staff.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibility-dateOfBirth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <Input
                      id="eligibility-dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={eligibilityForm.dateOfBirth}
                      onChange={handleEligibilityChange}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eligibility-gender">Gender</Label>
                  <Select value={eligibilityForm.gender} onValueChange={(value) => handleEligibilitySelectChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eligibility-weight">Weight (kg)</Label>
                  <div className="relative">
                    <Activity className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <Input
                      id="eligibility-weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={eligibilityForm.weight}
                      onChange={handleEligibilityChange}
                      placeholder="e.g. 68"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eligibility-hemoglobin">Hemoglobin (g/dL)</Label>
                  <div className="relative">
                    <Droplets className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <Input
                      id="eligibility-hemoglobin"
                      name="hemoglobin"
                      type="number"
                      min="0"
                      step="0.1"
                      value={eligibilityForm.hemoglobin}
                      onChange={handleEligibilityChange}
                      placeholder="e.g. 13.2"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="eligibility-lastDonationDate">Last Donation Date (optional)</Label>
                  <Input
                    id="eligibility-lastDonationDate"
                    name="lastDonationDate"
                    type="date"
                    value={eligibilityForm.lastDonationDate}
                    onChange={handleEligibilityChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="hadFever"
                    checked={eligibilityForm.hadFever}
                    onChange={handleEligibilityChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Fever or active infection</span>
                </label>

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="recentSurgery"
                    checked={eligibilityForm.recentSurgery}
                    onChange={handleEligibilityChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recent major surgery</span>
                </label>

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="onMedications"
                    checked={eligibilityForm.onMedications}
                    onChange={handleEligibilityChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">On medication that may defer</span>
                </label>

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="alcoholLast24h"
                    checked={eligibilityForm.alcoholLast24h}
                    onChange={handleEligibilityChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Alcohol in last 24 hours</span>
                </label>

                {eligibilityForm.gender === 'female' && (
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="pregnantOrBreastfeeding"
                      checked={eligibilityForm.pregnantOrBreastfeeding}
                      onChange={handleEligibilityChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pregnant or breastfeeding</span>
                  </label>
                )}
              </div>

              {/* Eligibility Assessment Result */}
              <div className="mt-6">
                {eligibilityAssessment.eligible ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="font-semibold">You look eligible to donate!</div>
                      <div className="text-sm mt-1">Final confirmation will be done during the onsite medical screening.</div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <div className="font-semibold">You may not be eligible right now</div>
                      <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                        {eligibilityAssessment.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {eligibilityError && (
                <Alert variant="destructive">
                  <AlertDescription>{eligibilityError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setUserType('patient');
                    setShowEligibilityForm(false);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleEligibilitySubmit}
                  disabled={!eligibilityAssessment.eligible || eligibilityLoading}
                >
                  {eligibilityLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <>Continue to Registration</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType">I am a</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="donor">Blood Donor</SelectItem>
                  <SelectItem value="bloodbank">Blood Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {userType === 'bloodbank' ? 'Contact Person Name' : 'Full Name'}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Blood Bank Name */}
            {userType === 'bloodbank' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bloodBankName">Blood Bank Name</Label>
                  <Input
                    id="bloodBankName"
                    name="bloodBankName"
                    type="text"
                    value={formData.bloodBankName}
                    onChange={handleInputChange}
                    placeholder="Enter blood bank name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="landlineNumber">Landline Number</Label>
                  <Input
                    id="landlineNumber"
                    name="landlineNumber"
                    type="text"
                    value={formData.landlineNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 040-12345678"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({ ...prev, phone: value }));
                }}
                placeholder="Enter 10-digits valid phone number"
                required
              />
            </div>

            {/* Donor Specific Fields */}
            {userType === 'donor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Address for donors and blood banks */}
            {(userType === 'donor' || userType === 'bloodbank') && (
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  required
                />
              </div>
            )}

            {/* Location for donors and blood banks */}
            {(userType === 'donor' || userType === 'bloodbank') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{locationLoading ? 'Detecting...' : 'Auto Detect'}</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      name="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="Latitude"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      name="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="Longitude"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

