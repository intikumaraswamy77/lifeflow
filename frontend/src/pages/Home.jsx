import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Heart, 
  Users, 
  MapPin, 
  MessageCircle, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const eligibilityCriteria = [
    "Age between 18-65 years",
    "Weight at least 50kg (110 lbs)",
    "Good general health",
    "No recent illness or medication",
    "Adequate hemoglobin levels",
    "No recent tattoos or piercings"
  ];

  const inspirationalQuotes = [
    "Be the reason someone believes in the goodness of people.",
    "Your blood donation can give someone a second chance at life.",
    "Heroes don't always wear capes, sometimes they just roll up their sleeves.",
    "The gift of blood is the gift of life. There is no greater gift than that.",
    "Donate blood and be someone's hero today."
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Main Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  LifeFlow
                </h1>
                <p className="text-xl md:text-2xl text-red-100">
                  Connecting Patients with Blood Donors
                </p>
                <p className="text-lg text-red-50 max-w-lg">
                  A life-saving platform that connects patients in urgent need of blood 
                  with nearby donors and blood banks through real-time location services.
                </p>
              </div>

              {/* Inspirational Quote */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <p className="text-lg italic text-center">
                  "{inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]}"
                </p>
              </div>

              {/* Action Buttons */}
              {!user ? (
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-red-600 hover:bg-red-50">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                     <Button size="lg" className="w-full sm:w-auto bg-white text-red-600 hover:bg-red-50">
                      Sign In
                    </Button>
                  </Link>

                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-white text-red-600 hover:bg-red-50">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                </div>
              )}
            </div>

            {/* Right Side - Eligibility Criteria */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Blood Donation Eligibility
              </h3>
              <div className="space-y-4">
                {eligibilityCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300 mt-0.5 flex-shrink-0" />
                    <span className="text-red-50">{criteria}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-2xl font-bold text-yellow-300">
                  "Every drop counts"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Type Navigation */}
      {!user && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Join Our Community
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose your role and start making a difference in someone's life today
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Patient Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Patient 
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Find nearby blood donors and blood banks quickly when you need blood urgently.
                  </p>
                  <Link to="/register?type=patient">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Register as Patient
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Donor Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Blood Donor
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Save lives by donating blood and responding to urgent requests from patients.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <Link to="/register?type=donor">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Register as Donor
                      </Button>
                    </Link>
                    <Link to="/eligibility">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Check Eligibility
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      Complete eligibility check before registration
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Blood Bank Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Blood Bank
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Manage blood inventory and connect with patients who need specific blood types.
                  </p>
                  <Link to="/register?type=bloodbank">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Register as Blood Bank
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Prediction Tool Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                    <Heart className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Blood Health Prediction
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Analyze blood parameters and get insights into possible conditions instantly.
                  </p>
                  <Link to="/prediction">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Go to Prediction 
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how our platform makes blood donation and finding donors easier than ever
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Location-Based Search
              </h3>
              <p className="text-gray-600">
                Find nearby donors and blood banks using GPS technology
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Messaging
              </h3>
              <p className="text-gray-600">
                Communicate directly with donors and blood banks instantly
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Platform
              </h3>
              <p className="text-gray-600">
                Your data is protected with enterprise-grade security
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                24/7 Availability
              </h3>
              <p className="text-gray-600">
                Access the platform anytime for urgent blood requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Save Lives?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of donors and help patients in need. Your contribution can make the difference between life and death.
          </p>
          {!user && (
            <Link to="/register">
              <Button size="lg" className="bg-white text-red-600 hover:bg-red-50">
                Join LifeFlow Today
                <Heart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
