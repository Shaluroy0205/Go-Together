import { Link, useNavigate } from 'react-router-dom';
import carImage from '../assets/car.svg';
import { 
  FaCar, FaShieldAlt, FaUserFriends, FaMoneyBillWave, FaLeaf, FaHandshake,
  FaMapMarkedAlt, FaCarSide, FaStar, FaArrowLeft, FaArrowRight,
  FaChartLine, FaCalendarAlt, FaBell, FaRoute, FaHistory, FaRegClock
} from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Reusable component for feature cards
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-500 hover:scale-105 min-h-[280px] sm:min-h-[320px] flex-1 border border-gray-100">
    <div className="flex flex-col items-center text-center">
      <div className="bg-[#4c48ec]/10 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#010D3E]">{title}</h3>
      <p className="text-base sm:text-lg text-[#010D3E]/80 leading-relaxed flex-grow">{description}</p>
    </div>
  </div>
);

//Reusable
const HowItWorksStep = ({ icon, title, description }) => (
  <div className="group w-full max-w-md mx-auto p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-500 hover:scale-105 border border-gray-100 relative overflow-hidden">
    {/* Background gradient effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#4c48ec]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="flex flex-col items-center text-center gap-3 sm:gap-4 relative z-10">
      {/* Icon container with animation */}
      <div className="bg-gradient-to-br from-[#4c48ec]/10 to-[#3b39d1]/10 p-4 sm:p-6 rounded-2xl mb-2 transform transition-transform duration-500 group-hover:scale-110">
        <div className="text-[#4c48ec] transform transition-transform duration-500 group-hover:scale-110">
        {icon}
      </div>
      </div>

      {/* Title with gradient text */}
      <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-[#4c48ec] to-[#3b39d1] bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Description with improved readability */}
      <p className="text-base sm:text-lg text-[#010D3E]/80 leading-relaxed flex-grow max-w-sm">
        {description}
      </p>
    </div>
  </div>
);

export const Landing = () => {
  // Feature list for the carousel
  const features = [
    {
      icon: <FaCar className="text-4xl text-[#4c48ec]" />,
      title: "Share Rides",
      description: "Find travel companions and split costs on your journeys. Make your trips more affordable and enjoyable."
    },
    {
      icon: <FaShieldAlt className="text-4xl text-[#4c48ec]" />,
      title: "Safe & Secure",
      description: "Travel with confidence using our verified user system and secure payment processing."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Community Driven",
      description: "Join a friendly community of travelers. Rate and review your experience after each ride."
    },
    {
      icon: <FaMoneyBillWave className="text-4xl text-[#4c48ec]" />,
      title: "Cost Effective",
      description: "Save money on your travels by sharing expenses with fellow travelers."
    },
    {
      icon: <FaLeaf className="text-4xl text-[#4c48ec]" />,
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint by sharing rides and contributing to a greener environment."
    },
    {
      icon: <FaHandshake className="text-4xl text-[#4c48ec]" />,
      title: "Reliable Partners",
      description: "Connect with verified and trustworthy travel companions for a worry-free journey."
    }
  ];

  // Steps for "How It Works"
  const howItWorks = [
    {
      icon: <FaMapMarkedAlt className="text-4xl text-[#4c48ec]" />,
      title: "Plan Your Journey",
      description: "Enter your destination and travel dates to find available rides or post your own journey."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Connect with Travelers",
      description: "Browse through profiles, check reviews, and connect with compatible travel companions."
    },
    {
      icon: <FaCarSide className="text-4xl text-[#4c48ec]" />,
      title: "Share the Ride",
      description: "Confirm your booking, meet your travel buddies, and split the costs fairly."
    },
    {
      icon: <FaStar className="text-4xl text-[#4c48ec]" />,
      title: "Rate & Review",
      description: "After your journey, rate your experience and help build a trusted community."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Modified carousel logic to create a smooth forward-only loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        // When we reach the end, smoothly transition back to the beginning
        if (nextIndex >= features.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Calculate the transform value for smooth transition
  const getTransformValue = () => {
    // Different card widths for different screen sizes
    const cardWidth = window.innerWidth < 640 ? 100 : // Full width on mobile
                     window.innerWidth < 1024 ? 50 : // Half width on tablet
                     33.33; // One-third width on desktop
    
    const totalWidth = features.length * cardWidth;
    const currentPosition = currentIndex * cardWidth;
    
    // If we're at the end, smoothly transition back to the beginning
    if (currentIndex >= features.length - (window.innerWidth < 640 ? 1 : 
                                        window.innerWidth < 1024 ? 2 : 3)) {
      return `translateX(-${totalWidth - (window.innerWidth < 640 ? cardWidth : 
                                        window.innerWidth < 1024 ? cardWidth * 2 : 
                                        cardWidth * 3)}%)`;
    }
    
    return `translateX(-${currentPosition}%)`;
  };

  // Quick action buttons for logged-in users
  const quickActions = [
    {
      icon: <FaMapMarkedAlt className="h-6 w-6" />,
      title: "Find a Ride",
      description: "Search for available rides",
      action: () => navigate('/rides'),
      color: "bg-indigo-500"
    },
    {
      icon: <FaCarSide className="h-6 w-6" />,
      title: "Offer a Ride",
      description: "Share your journey",
      action: () => navigate('/rides/create'),
      color: "bg-green-500"
    },
    {
      icon: <FaUserFriends className="h-6 w-6" />,
      title: "My Rides",
      description: "View your rides",
      action: () => navigate('/my-rides'),
      color: "bg-blue-500"
    }
  ];

  const handleGetStarted = () => {
    setIsLoading(true);
    navigate('/register');
  };

  const handleSignIn = () => {
    setIsLoading(true);
    navigate('/login');
  };

  const handleJoinNow = () => {
    setIsLoading(true);
    navigate('/register');
  };

  return (
    <section className="min-h-screen bg-white relative overflow-hidden h-full w-full">
      <div className="absolute inset-0 bg-[#4c48ec]/5" />
      
      {/* Main container with proper max-width and padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        {/* Hero Section with fixed layout */}
        <div className={`grid grid-cols-1 ${!isAuthenticated ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 lg:gap-12 items-center py-8 sm:py-12 lg:py-16`}>
          {/* Content Section */}
          <div className={`w-full ${isAuthenticated ? '' : 'order-2 lg:order-1'}`}>
            {isAuthenticated ? (
              <>
                {/* Overview Dashboard Section */}
                <div className="bg-gradient-to-r from-[#4c48ec]/10 via-white to-[#3b39d1]/10 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-100">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                    <div className="w-full lg:w-auto">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#4c48ec] to-[#3b39d1] bg-clip-text text-transparent mb-2 sm:mb-3">
                        Welcome back, {user?.firstName || 'Traveler'}! 👋
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-[#010D3E]/80">
                        Your personal travel dashboard awaits with exciting opportunities.
                      </p>
                    </div>
                    <div className="w-full lg:w-auto grid grid-cols-3 sm:flex items-center gap-3 sm:gap-6 bg-white p-3 sm:p-4 rounded-xl shadow-sm">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-[#4c48ec]">0</div>
                        <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Rides Shared</div>
                      </div>
                      <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-500">$0</div>
                        <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Cost Saved</div>
                      </div>
                      <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-amber-500">0</div>
                        <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">kg CO₂ Saved</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#010D3E] mb-6 flex items-center gap-2">
                    <FaRoute className="text-[#4c48ec]" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center transform hover:scale-[1.03] active:scale-[0.98]`}
                      >
                        <div className="p-3 bg-white/20 rounded-full mb-3 backdrop-blur-sm transform transition-transform duration-300 group-hover:scale-110">
                          {action.icon}
                        </div>
                        <h3 className="text-lg font-semibold transition-all duration-300">{action.title}</h3>
                        <p className="text-sm text-white/90 mt-2 transition-all duration-300">{action.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features and Benefits Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#010D3E] mb-6 flex items-center gap-2">
                    <FaStar className="text-[#4c48ec]" />
                    Features
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <FaRoute className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-indigo-900">Smart Route Matching</h3>
                          <p className="text-indigo-700/80 mt-2">AI-powered route matching for perfect travel companions.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FaLeaf className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-green-900">Environmental Impact</h3>
                          <p className="text-green-700/80 mt-2">Real-time tracking of your carbon footprint reduction.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FaShieldAlt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-blue-900">Enhanced Security</h3>
                          <p className="text-blue-700/80 mt-2">Advanced verification and secure payment system.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Dashboard Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#010D3E] mb-6 flex items-center gap-2">
                    <FaHistory className="text-[#4c48ec]" />
                    Activity Dashboard
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        <Link to="/my-rides" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          View All <FaArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                          <FaRegClock className="h-4 w-4 text-[#4c48ec]" />
                          <span>No recent activity to show</span>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Rides */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Upcoming Rides</h3>
                        <Link to="/rides" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          Find Rides <FaArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                          <FaCalendarAlt className="h-4 w-4 text-[#4c48ec]" />
                          <span>No upcoming rides scheduled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tips Section */}
                <div className="bg-gradient-to-r from-[#4c48ec]/10 to-[#3b39d1]/10 rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-[#010D3E] mb-6 flex items-center gap-2">
                    <FaBell className="text-[#4c48ec]" />
                    Tips & Recommendations
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-center gap-3 text-[#4c48ec] mb-3">
                        <FaStar className="h-5 w-5" />
                        <span className="font-medium">Enhance Your Profile</span>
                      </div>
                      <p className="text-sm text-gray-600">Complete your profile with a photo and verification to increase trust and booking success.</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-center gap-3 text-[#4c48ec] mb-3">
                        <FaUserFriends className="h-5 w-5" />
                        <span className="font-medium">Build Your Network</span>
                      </div>
                      <p className="text-sm text-gray-600">Connect with regular travelers on your route to create a reliable travel circle.</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-center gap-3 text-[#4c48ec] mb-3">
                        <FaBell className="h-5 w-5" />
                        <span className="font-medium">Stay Notified</span>
                      </div>
                      <p className="text-sm text-gray-600">Enable push notifications to get instant updates about ride matches and requests.</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-[#010D3E]">
                  Welcome to GoTogether
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-[#010D3E] tracking-tight mt-4 sm:mt-6 max-w-xl leading-relaxed">
                  Share rides, reduce costs, and make new connections. Join our community of travelers making transportation more sustainable and social.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    onClick={handleGetStarted}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-[#4c48ec] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center tracking-tight hover:bg-[#3b39d1] transition-all shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    aria-label="Get Started with GoTogether"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        <span>Please wait...</span>
                      </div>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-white text-[#4c48ec] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center tracking-tight gap-2 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border border-[#4c48ec]/20 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    aria-label="Sign In to GoTogether"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-[#4c48ec] rounded-full animate-spin"></div>
                        <span>Please wait...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Image Section - Only show for non-authenticated users */}
          {!isAuthenticated && (
            <div className="w-full flex justify-center items-center order-1 lg:order-2">
            <img
              src={carImage}
              alt="Illustrative car graphic"
                className="w-full h-auto object-contain max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] drop-shadow-2xl"
            />
          </div>
          )}
      </div>

      {/* Features Carousel Section */}
        {!isAuthenticated && (
          <div className="mt-20 sm:mt-24 lg:mt-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-[#010D3E]">
          Why Choose GoTogether?
        </h2>
            <p className="text-center text-lg sm:text-xl text-[#010D3E]/80 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto px-4">
          Experience the future of shared transportation
        </p>
        <div className="max-w-7xl mx-auto relative">
          <div className="overflow-hidden">
            <div
                  className="flex transition-transform duration-1000 ease-in-out"
                  style={{ transform: getTransformValue() }}
            >
              {features.map((feature, index) => (
                    <div key={index} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-4">
                      <FeatureCard 
                        icon={feature.icon} 
                        title={feature.title} 
                        description={feature.description} 
                      />
                    </div>
                  ))}
                  {/* Duplicate first few cards for smooth loop */}
                  {features.slice(0, window.innerWidth < 640 ? 1 : 
                                    window.innerWidth < 1024 ? 2 : 3).map((feature, index) => (
                    <div key={`duplicate-${index}`} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-4">
                  <FeatureCard 
                    icon={feature.icon} 
                    title={feature.title} 
                    description={feature.description} 
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Dot Navigation */}
              <div className="flex justify-center mt-6 sm:mt-8 gap-2 sm:gap-3">
            {Array.from({ length: features.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View slide ${index + 1}`}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                        ? 'bg-[#4c48ec] w-6 sm:w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
        )}

      {/* How It Works Section */}
        {!isAuthenticated && (
          <div className="mt-20 sm:mt-24 lg:mt-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#4c48ec]/5 to-transparent rounded-3xl -mx-4 -my-8" />
        <div className="relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 bg-gradient-to-r from-[#4c48ec] to-[#3b39d1] bg-clip-text text-transparent">
            How GoTogether Works
          </h2>
              <p className="text-center text-lg sm:text-xl text-[#010D3E]/80 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto px-4">
            Get started with GoTogether in four simple steps
          </p>
              <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {howItWorks.map((step, index) => (
              <HowItWorksStep
                key={index}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </div>
        )}

      {/* CTA Footer Section */}
        {!isAuthenticated && (
          <div className="mt-20 sm:mt-24 lg:mt-32 bg-[#4c48ec] text-white py-12 sm:py-16 lg:py-20 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Ready to Start Sharing?</h2>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-white/90">Join thousands of travelers making their journeys more sustainable and social.</p>
          <button
            onClick={handleJoinNow}
            disabled={isLoading}
            className="inline-flex items-center justify-center bg-white text-[#4c48ec] px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] gap-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-t-2 border-b-2 border-[#4c48ec] rounded-full animate-spin"></div>
                <span>Please wait...</span>
              </div>
            ) : (
              <>
                <span>Join Now - It's Free!</span>
                <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Landing;
