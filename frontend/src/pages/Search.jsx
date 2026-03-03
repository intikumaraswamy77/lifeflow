import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { getCurrentLocation, bloodGroups, calculateDistance, getBloodGroupColor } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Search as SearchIcon, 
  MapPin, 
  Heart, 
  Building2, 
  MessageCircle,
  Phone,
  User,
  Navigation
} from 'lucide-react';

const Search = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useState({
    latitude: location.state?.location?.latitude || '',
    longitude: location.state?.location?.longitude || '',
    bloodGroup: '',
    maxDistance: '10'
  });
  
  const [results, setResults] = useState({ donors: [], bloodBanks: [], meta: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    // If user is not a patient, redirect to dashboard
    if (user && user.userType !== 'patient') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const detectLocation = async () => {
    setLocationLoading(true);
    setError('');
    
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
        throw new Error('Could not get valid location coordinates');
      }
      
      setSearchParams(prev => ({
        ...prev,
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString()
      }));
      
      // Show success message
      setError('Location detected successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setError(''), 3000);
      
    } catch (error) {
      console.error('Location detection error:', error);
      let errorMessage = 'Failed to detect location. ';
      
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage += 'Please enable location permissions in your browser settings.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage += 'Location information is unavailable. Please try again or enter manually.';
      } else if (error.code === error.TIMEOUT) {
        errorMessage += 'Location request timed out. Please try again.';
      } else {
        errorMessage += 'Please enter your location manually.';
      }
      
      setError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const validateCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return { valid: false, error: 'Please enter valid latitude and longitude' };
    }
    
    if (latNum < -90 || latNum > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90 degrees' };
    }
    
    if (lngNum < -180 || lngNum > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180 degrees' };
    }
    
    return { valid: true };
  };

  const handleSearch = async () => {
    // Validate location is provided
    if (!searchParams.latitude || !searchParams.longitude) {
      setError('Please provide your location to search');
      return;
    }
    
    // Parse coordinates as floats
    const latitude = parseFloat(searchParams.latitude);
    const longitude = parseFloat(searchParams.longitude);
    
    // Validate coordinates format and range
    const { valid, error } = validateCoordinates(latitude, longitude);
    if (!valid) {
      setError(error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure maxDistance is properly converted to a number and then to meters
      const maxDistanceKm = Number(searchParams.maxDistance);
      if (isNaN(maxDistanceKm) || maxDistanceKm <= 0) {
        setError('Please select a valid maximum distance');
        setLoading(false);
        return;
      }

      // Prepare search data with proper number formatting
      const searchData = {
        latitude: latitude,
        longitude: longitude,
        maxDistance: Math.round(maxDistanceKm * 1000), // Convert km to meters
        ...(searchParams.bloodGroup && { bloodGroup: searchParams.bloodGroup })
      };

      console.log('Searching with data:', searchData);
      
      // Add debug info
      console.log('Raw coordinates from input:', {
        inputLatitude: searchParams.latitude,
        inputLongitude: searchParams.longitude,
        parsedLatitude: latitude,
        parsedLongitude: longitude,
        isLatValid: !isNaN(latitude) && latitude >= -90 && latitude <= 90,
        isLngValid: !isNaN(longitude) && longitude >= -180 && longitude <= 180
      });
      
      const response = await apiClient.searchNearby(searchData);
      
      if (!response) {
        throw new Error('No response from server');
      }
      
      console.log('Search response:', {
        donorsFound: response.donors?.length || 0,
        bloodBanksFound: response.bloodBanks?.length || 0,
        searchCenter: response.searchLocation
      });
      
      setResults(response);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUser = (userId, userName, userType, userBloodGroup) => {
    navigate('/messages', {
      state: {
        startConversation: {
          userId,
          userName,
          userType,
          bloodGroup: userBloodGroup
        }
      }
    });
  };

  const DonorCard = ({ donor }) => {
    const distance = calculateDistance(
      parseFloat(searchParams.latitude),
      parseFloat(searchParams.longitude),
      donor.location.coordinates[1],
      donor.location.coordinates[0]
    );

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <span>{donor.name}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBloodGroupColor(donor.bloodGroup)}`}>
              {donor.bloodGroup}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center space-x-1 text-gray-600">
                <User className="h-4 w-4" />
                <span>Age: {donor.age} years</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{donor.phone}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Navigation className="h-4 w-4" />
                <span>{distance} km away</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{donor.address}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => handleContactUser(donor._id, donor.name, 'donor', donor.bloodGroup)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Donor
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const BloodBankCard = ({ bloodBank }) => {
    const distance = calculateDistance(
      parseFloat(searchParams.latitude),
      parseFloat(searchParams.longitude),
      bloodBank.location.coordinates[1],
      bloodBank.location.coordinates[0]
    );

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <span>{bloodBank.bloodBankName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center space-x-1 text-gray-600">
                <User className="h-4 w-4" />
                <span>Contact: {bloodBank.name}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>Mobile: {bloodBank.phone}</span>
              </div>
              {bloodBank.landlineNumber && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>Landline: {bloodBank.landlineNumber}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Navigation className="h-4 w-4" />
                <span>{distance} km away</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{bloodBank.address}</span>
              </div>
            </div>
          </div>

          {/* Blood Stock Display */}
          {bloodBank.bloodStock && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Blood Groups:</h4>
              <div className="grid grid-cols-4 gap-2">
                {bloodGroups.map(group => (
                  <div key={group} className="text-center">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getBloodGroupColor(group)}`}>
                      {group}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {bloodBank.bloodStock[group] || 0} units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => handleContactUser(bloodBank._id, bloodBank.bloodBankName, 'bloodbank', null)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Blood Bank
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Blood Donors & Banks</h1>
        <p className="text-gray-600">Search for nearby blood donors and blood banks in your area</p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SearchIcon className="h-5 w-5" />
            <span>Search Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Your latitude"
                value={searchParams.latitude}
                onChange={(e) => setSearchParams(prev => ({ ...prev, latitude: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Your longitude"
                value={searchParams.longitude}
                onChange={(e) => setSearchParams(prev => ({ ...prev, longitude: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Blood Group (Optional)</Label>
              <Select 
                value={searchParams.bloodGroup} 
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, bloodGroup: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any blood group" />
                </SelectTrigger>
                <SelectContent>
                  {/* Removed the problematic SelectItem with value="" */}
                  {bloodGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Max Distance (km)</Label>
              <Select 
                value={searchParams.maxDistance} 
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, maxDistance: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={detectLocation}
              disabled={locationLoading}
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>{locationLoading ? 'Detecting...' : 'Auto Detect Location'}</span>
            </Button>
            
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <SearchIcon className="h-4 w-4" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {(results.donors.length > 0 || results.bloodBanks.length > 0) && (
        <div className="space-y-8">
          {/* Warning if results may be limited */}
          {results.meta && (results.meta.possiblyMoreDonors || results.meta.possiblyMoreBloodBanks) && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> Showing maximum results (100 per category). There may be more {' '}
                {results.meta.possiblyMoreDonors && results.meta.possiblyMoreBloodBanks ? 'donors and blood banks' : 
                 results.meta.possiblyMoreDonors ? 'donors' : 'blood banks'} in your search area. 
                Try reducing the search distance or adding a blood group filter for more specific results.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Blood Donors */}
          {results.donors.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-600" />
                <span>Blood Donors ({results.donors.length}{results.meta?.possiblyMoreDonors ? '+' : ''})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.donors.map(donor => (
                  <DonorCard key={donor._id} donor={donor} />
                ))}
              </div>
            </div>
          )}

          {/* Blood Banks */}
          {results.bloodBanks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-green-600" />
                <span>Blood Banks ({results.bloodBanks.length}{results.meta?.possiblyMoreBloodBanks ? '+' : ''})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.bloodBanks.map(bloodBank => (
                  <BloodBankCard key={bloodBank._id} bloodBank={bloodBank} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && results.donors.length === 0 && results.bloodBanks.length === 0 && searchParams.latitude && searchParams.longitude && (
        <Card>
          <CardContent className="p-8 text-center">
            <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              No blood donors or banks found in your search area. Try expanding your search radius or removing blood group filter.
            </p>
            <Button variant="outline" onClick={() => setSearchParams(prev => ({ ...prev, maxDistance: '50', bloodGroup: '' }))}>
              Expand Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;

