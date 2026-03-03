import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { getCurrentLocation, bloodGroups, validatePassword } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, 
  MapPin, 
  Lock, 
  Heart, 
  Building2,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      // Extract coordinates from GeoJSON format [longitude, latitude]
      const hasLocation = user.location?.coordinates && Array.isArray(user.location.coordinates);
      const lng = hasLocation ? user.location.coordinates[0] : '';
      const lat = hasLocation ? user.location.coordinates[1] : '';
      
      
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        bloodGroup: user.bloodGroup || '',
        address: user.address || '',
        bloodBankName: user.bloodBankName || '',
        landlineNumber: user.landlineNumber || '',
        latitude: lat ? lat.toString() : '',
        longitude: lng ? lng.toString() : ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setProfileData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString()
      }));
    } catch (error) {
      setError('Failed to detect location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate blood bank landline
      if (user.userType === 'bloodbank') {
        if (!profileData.landlineNumber.trim()) {
          setError('Landline number is required for blood banks');
          setLoading(false);
          return;
        }
        if (profileData.landlineNumber.trim().length < 6) {
          setError('Landline number must be at least 6 characters');
          setLoading(false);
          return;
        }
      }

      const updates = {
        name: profileData.name.trim(),
        ...(user.userType === 'donor' && {
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          bloodGroup: profileData.bloodGroup,
          address: profileData.address.trim()
        }),
        ...(user.userType === 'bloodbank' && {
          bloodBankName: profileData.bloodBankName.trim(),
          landlineNumber: profileData.landlineNumber.trim(),
          address: profileData.address.trim()
        })
      };

      // Add location for donors and blood banks
      if ((user.userType === 'donor' || user.userType === 'bloodbank') && 
          profileData.latitude && profileData.longitude) {
        // Validate and convert coordinates
        const lat = parseFloat(profileData.latitude);
        const lng = parseFloat(profileData.longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          setError('Please enter valid latitude and longitude values');
          setLoading(false);
          return;
        }
        
        if (lat < -90 || lat > 90) {
          setError('Latitude must be between -90 and 90');
          setLoading(false);
          return;
        }
        
        if (lng < -180 || lng > 180) {
          setError('Longitude must be between -180 and 180');
          setLoading(false);
          return;
        }
        
        // Send latitude/longitude - backend will convert to GeoJSON
        updates.latitude = lat;
        updates.longitude = lng;
      }

      const updatedUser = await apiClient.updateProfile(updates);
      updateUser(updatedUser.user);
      
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      setError('New password is required');
      return;
    }

    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile Information</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Change Password</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {user.userType === 'donor' && <Heart className="h-5 w-5 text-red-600" />}
                {user.userType === 'bloodbank' && <Building2 className="h-5 w-5 text-green-600" />}
                {user.userType === 'patient' && <User className="h-5 w-5 text-blue-600" />}
                <span>
                  {user.userType === 'donor' && 'Donor Profile'}
                  {user.userType === 'bloodbank' && 'Blood Bank Profile'}
                  {user.userType === 'patient' && 'Patient Profile'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {user.userType === 'bloodbank' ? 'Contact Person Name' : 'Full Name'}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Phone number cannot be changed</p>
                </div>
              </div>

              {/* Blood Bank Specific Fields */}
              {user.userType === 'bloodbank' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bloodBankName">Blood Bank Name</Label>
                    <Input
                      id="bloodBankName"
                      name="bloodBankName"
                      value={profileData.bloodBankName}
                      onChange={handleInputChange}
                      placeholder="Enter blood bank name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="landlineNumber">Landline Number</Label>
                    <Input
                      id="landlineNumber"
                      name="landlineNumber"
                      value={profileData.landlineNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 040-12345678"
                      required
                    />
                  </div>
                </>
              )}

              {/* Donor Specific Fields */}
              {user.userType === 'donor' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={profileData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
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
                      <Select value={profileData.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
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
                  </div>

                  {/* Donor self-report fields removed as per requirement */}
                </>
              )}

              {/* Address for donors and blood banks */}
              {(user.userType === 'donor' || user.userType === 'bloodbank') && (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                  />
                </div>
              )}

              {/* Location for donors and blood banks */}
              {(user.userType === 'donor' || user.userType === 'bloodbank') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Location Coordinates</Label>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        value={profileData.latitude}
                        onChange={handleInputChange}
                        placeholder="Latitude"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        value={profileData.longitude}
                        onChange={handleInputChange}
                        placeholder="Longitude"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={changePassword} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

