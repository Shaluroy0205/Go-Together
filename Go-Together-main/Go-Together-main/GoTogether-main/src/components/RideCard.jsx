import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rides } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  UsersIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function RideCard({ ride, onRequest }) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const handleRequestRide = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to request a ride');
      navigate('/login');
      return;
    }

    // Check if the user is trying to request their own ride
    const creatorId = ride.creator?.id || ride.creator;
    if (user && (user.id === creatorId)) {
      toast.error("You can't request your own ride!");
      return;
    }

    setLoading(true);
    try {
      await rides.requestRide(ride.id || ride._id);
      toast.success('Ride requested successfully!');
      if (onRequest) onRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (!isAuthenticated) {
      toast.error('Please login to view ride details');
      navigate('/login');
      return;
    }
    
    navigate(`/rides/${ride.id || ride._id}`);
  };

  const creatorId = ride.creator?.id || ride.creator || '';
  const creatorFirstName = ride.creator?.firstName || 'Unknown';
  const creatorLastName = ride.creator?.lastName || 'User';
  const creatorRating = ride.creator?.rating;
  const price = ride.price || 0;
  const pickupCoordinates = ride.pickupLocation?.coordinates || [0, 0];
  const dropoffCoordinates = ride.dropoffLocation?.coordinates || [0, 0];
  const departureTime = ride.departureTime || ride.time || new Date().toISOString();
  const availableSeats = ride.availableSeats || ride.seatsAvailable || 0;
  const preferences = ride.preferences || {};
  
  const isUserRide = user?.id === creatorId;
  const hasRequested = ride.passengers?.some(
    (p) => (p.user === user?.id || (p.user?.id === user?.id)) && p.status === 'pending'
  );
  const isConfirmed = ride.passengers?.some(
    (p) => (p.user === user?.id || (p.user?.id === user?.id)) && p.status === 'confirmed'
  );

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="p-4">
        {/* Header with driver info and price */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium shadow-sm flex-shrink-0">
              {creatorFirstName[0]}
              {creatorLastName[0]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {creatorFirstName} {creatorLastName}
              </h3>
              <div className="text-xs text-gray-500 flex items-center">
                {creatorRating ? (
                  <div className="flex items-center">
                    <span className="text-amber-500">★</span>
                    <span className="ml-1 font-medium">{creatorRating}</span>
                  </div>
                ) : (
                  'New User'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 rounded-lg p-2 mt-1 sm:mt-0">
            <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
            <div className="text-base font-bold text-gray-900">
              ${parseFloat(price).toFixed(2)}
              <span className="text-xs font-normal text-gray-500 ml-1">per seat</span>
            </div>
          </div>
        </div>

        {/* Ride details */}
        <div className="mt-4 space-y-3.5">
          {/* Pickup location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <MapPinIcon className="w-3.5 h-3.5 text-green-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Pickup</div>
              <div className="font-medium text-sm text-gray-900 break-words">
                {ride.pickupLocation?.address || 
                (Array.isArray(pickupCoordinates) ? `[${pickupCoordinates.join(', ')}]` : pickupCoordinates)}
              </div>
            </div>
          </div>

          {/* Dropoff location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <MapPinIcon className="w-3.5 h-3.5 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Dropoff</div>
              <div className="font-medium text-sm text-gray-900 break-words">
                {ride.dropoffLocation?.address || 
                (Array.isArray(dropoffCoordinates) ? `[${dropoffCoordinates.join(', ')}]` : dropoffCoordinates)}
              </div>
            </div>
          </div>
        </div>

        {/* Date and Available Seats */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 text-gray-500 mr-1.5" />
            <span className="text-xs text-gray-700">{formatDate(departureTime)}</span>
          </div>
          <div className="flex items-center justify-end">
            <UsersIcon className="w-4 h-4 text-gray-500 mr-1.5" />
            <span className="text-xs text-gray-700">{availableSeats} seats</span>
          </div>
        </div>

        {/* Preferences */}
        {Object.keys(preferences).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {preferences.smoking !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                preferences.smoking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {preferences.smoking ? '🚬 Smoking' : 'No smoking'}
              </span>
            )}
            {preferences.pets !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                preferences.pets ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {preferences.pets ? '🐾 Pets' : 'No pets'}
              </span>
            )}
            {preferences.gender && preferences.gender !== 'any' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {preferences.gender === 'male' ? '👤 Male only' : '👤 Female only'}
              </span>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleViewDetails}
            className="btn-secondary px-3 py-2 text-xs sm:text-sm rounded-md flex items-center justify-center"
          >
            View Details
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
          
          {isUserRide ? (
            <button 
              disabled 
              className="bg-gray-100 text-gray-500 px-3 py-2 text-xs sm:text-sm rounded-md flex items-center justify-center"
            >
              Your ride
            </button>
          ) : isConfirmed ? (
            <button 
              disabled 
              className="bg-green-100 text-green-800 px-3 py-2 text-xs sm:text-sm rounded-md flex items-center justify-center"
            >
              Confirmed ✓
            </button>
          ) : hasRequested ? (
            <button 
              disabled 
              className="bg-yellow-100 text-yellow-800 px-3 py-2 text-xs sm:text-sm rounded-md flex items-center justify-center"
            >
              Pending...
            </button>
          ) : (
            <button
              onClick={handleRequestRide}
              disabled={loading}
              className="btn-primary px-3 py-2 text-xs sm:text-sm rounded-md flex items-center justify-center"
            >
              {loading ? 'Requesting...' : 'Request Ride'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 