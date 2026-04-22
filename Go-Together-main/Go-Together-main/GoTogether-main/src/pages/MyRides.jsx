import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function MyRides() {
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationCache, setLocationCache] = useState({});
  const [showMobileModal, setShowMobileModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get the Google Maps API key from environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fetch user's rides
  useEffect(() => {
    fetchMyRides();
  }, [user]);

  // Function to reverse geocode coordinates to address
  const getLocationNameFromCoordinates = useCallback(async (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return null;
    }
    
    // Create a cache key from coordinates
    const cacheKey = coordinates.join(',');
    
    // Check if we have a cached result
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found in environment variables');
      return null;
    }
    
    try {
      // Reverse coordinates order for Google Maps API
      // Most geospatial DBs store as [longitude, latitude] but Google Maps expects [latitude, longitude]
      const lng = coordinates[0];
      const lat = coordinates[1];
      
      // Use correct order for Google Maps API: latitude,longitude
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Get formatted address from the first result
        const formattedAddress = data.results[0].formatted_address;
        
        // Cache the result
        setLocationCache(prev => ({
          ...prev,
          [cacheKey]: formattedAddress
        }));
        
        return formattedAddress;
      } else {
        console.error('Geocoding API error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error geocoding coordinates:', error);
      return null;
    }
  }, [GOOGLE_MAPS_API_KEY, locationCache]);

  // Effect to fetch and update locations for all rides
  useEffect(() => {
    const updateLocationNames = async () => {
      let updatedAnyLocation = false;
      
      // First update the myRides array
      const ridesWithUpdatedLocations = await Promise.all(
        myRides.map(async (ride) => {
          const updatedRide = { ...ride };
          
          // Try to update pickup location name
          if (ride.pickupLocation?.coordinates && 
              !ride.pickupLocation.cachedName && 
              Array.isArray(ride.pickupLocation.coordinates)) {
            const pickupName = await getLocationNameFromCoordinates(ride.pickupLocation.coordinates);
            
            if (pickupName) {
              updatedAnyLocation = true;
              updatedRide.pickupLocation = {
                ...ride.pickupLocation,
                cachedName: pickupName
              };
            }
          }
          
          // Try to update dropoff location name
          if (ride.dropoffLocation?.coordinates && 
              !ride.dropoffLocation.cachedName && 
              Array.isArray(ride.dropoffLocation.coordinates)) {
            const dropoffName = await getLocationNameFromCoordinates(ride.dropoffLocation.coordinates);
            
            if (dropoffName) {
              updatedAnyLocation = true;
              updatedRide.dropoffLocation = {
                ...ride.dropoffLocation,
                cachedName: dropoffName
              };
            }
          }
          
          return updatedRide;
        })
      );
      
      // Then update the selected ride if it exists
      let updatedSelectedRide = selectedRide;
      if (selectedRide) {
        updatedSelectedRide = { ...selectedRide };
        
        // Try to update pickup location name
        if (selectedRide.pickupLocation?.coordinates && 
            !selectedRide.pickupLocation.cachedName && 
            Array.isArray(selectedRide.pickupLocation.coordinates)) {
          const pickupName = await getLocationNameFromCoordinates(selectedRide.pickupLocation.coordinates);
          
          if (pickupName) {
            updatedAnyLocation = true;
            updatedSelectedRide.pickupLocation = {
              ...selectedRide.pickupLocation,
              cachedName: pickupName
            };
          }
        }
        
        // Try to update dropoff location name
        if (selectedRide.dropoffLocation?.coordinates && 
            !selectedRide.dropoffLocation.cachedName && 
            Array.isArray(selectedRide.dropoffLocation.coordinates)) {
          const dropoffName = await getLocationNameFromCoordinates(selectedRide.dropoffLocation.coordinates);
          
          if (dropoffName) {
            updatedAnyLocation = true;
            updatedSelectedRide.dropoffLocation = {
              ...selectedRide.dropoffLocation,
              cachedName: dropoffName
            };
          }
        }
      }
      
      // Only update state if any locations were updated
      if (updatedAnyLocation) {
        setMyRides(ridesWithUpdatedLocations);
        if (selectedRide) {
          setSelectedRide(updatedSelectedRide);
        }
      }
    };
    
    if ((myRides.length > 0 || selectedRide) && GOOGLE_MAPS_API_KEY) {
      updateLocationNames();
    }
  }, [myRides, selectedRide, getLocationNameFromCoordinates, GOOGLE_MAPS_API_KEY]);

  const fetchMyRides = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user rides...');
      const response = await ridesApi.getUserRides();
      console.log('User rides response:', response);
      
      // Handle different response formats
      let rides = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        rides = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        rides = response.data;
      } else if (response.data && typeof response.data === 'object') {
        rides = [response.data];
      }
      
      setMyRides(rides);
      
      // If we have rides, select the first one by default
      if (rides.length > 0) {
        setSelectedRide(rides[0]);
        setSelectedRideId(rides[0].id || rides[0]._id);
        fetchRideDetails(rides[0].id || rides[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch user rides:', error);
      let errorMessage = 'Failed to load your rides.';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data?.message || 'Server error. Please try again.';
        
        if (error.response.status === 401) {
          navigate('/login');
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ride details and passengers
  const fetchRideDetails = async (rideId) => {
    if (!rideId) return;
    
    try {
      setRequestsLoading(true);
      
      const response = await ridesApi.getRideById(rideId);
      console.log('Ride details response:', response);
      
      // Get ride details and update the selected ride
      const rideDetails = response.data.data || response.data;
      setSelectedRide(rideDetails);
      
      // Extract passengers
      const passengers = rideDetails.passengers || [];
      setPendingRequests(passengers);
      
    } catch (error) {
      console.error('Failed to fetch ride details:', error);
      let errorMessage = 'Failed to load ride details.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Handle ride selection
  const handleRideSelect = (ride) => {
    const rideId = ride.id || ride._id;
    
    // Check if this ride is already selected
    if (rideId === selectedRideId) {
      // On mobile, we still want to show the modal even if it's the same ride
      setShowMobileModal(true);
      return;
    }
    
    // Update both the selected ride object and its ID
    setSelectedRide(ride);
    setSelectedRideId(rideId);
    setShowMobileModal(true); // Show modal on mobile when selecting a ride
    fetchRideDetails(rideId);
  };

  // Close the mobile modal
  const closeMobileModal = () => {
    setShowMobileModal(false);
  };

  // Handle request approval/rejection
  const handleRequestAction = async (requestId, status) => {
    if (!selectedRide) return;
    
    try {
      setActionLoading(true);
      const rideId = selectedRide.id || selectedRide._id;
      
      await ridesApi.approveRequest(rideId, requestId, status);
      
      toast.success(`Request ${status === 'confirmed' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh the ride details to update passengers list
      fetchRideDetails(rideId);
      // Also refresh the rides list
      fetchMyRides();
    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
      let errorMessage = `Failed to ${status === 'confirmed' ? 'approve' : 'reject'} request.`;
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle updating a ride
  const handleEditRide = (rideId) => {
    // Navigate to edit ride page 
    navigate(`/rides/edit/${rideId}`);
  };

  // Handle canceling a ride
  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride? All passengers will be notified.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.cancelRide(rideId);
      toast.success('Ride cancelled successfully');
      fetchMyRides();
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle completing a ride
  const handleCompleteRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to mark this ride as completed?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.completeRide(rideId);
      toast.success('Ride marked as completed');
      fetchMyRides();
    } catch (error) {
      console.error('Failed to complete ride:', error);
      toast.error(error.response?.data?.message || 'Failed to complete ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Utility functions to handle different data formats

  // Get user ID from request object
  const getUserId = (request) => {
    if (typeof request.user === 'string') {
      return request.user;
    } else if (request.user && (request.user.id || request.user._id)) {
      return request.user.id || request.user._id;
    } else if (request.userId) {
      return request.userId;
    } else if (request.id || request._id) {
      return request.id || request._id;
    }
    return null;
  };

  // Get user name from request object
  const getUserName = (request) => {
    if (request.user && typeof request.user !== 'string') {
      if (request.user.firstName && request.user.lastName) {
        return `${request.user.firstName} ${request.user.lastName}`;
      } else if (request.user.name) {
        return request.user.name;
      } else if (request.user.username) {
        return request.user.username;
      }
    } else if (request.name) {
      return request.name;
    } else if (request.userName) {
      return request.userName;
    }
    return 'Unknown User';
  };

  // Get user initial for avatar
  const getUserInitial = (request) => {
    const name = getUserName(request);
    return name.charAt(0).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      // Format: "Mar 30, 2024 at 10:00 AM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'No date';
    }
  };

  // Get pending requests count for a ride
  const getPendingRequestsCount = (ride) => {
    if (!ride || !ride.passengers) return 0;
    
    return ride.passengers.filter(p => p.status === 'pending').length;
  };

  // Get status color based on ride status
  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Enhanced getLocationString to use Google Maps API data
  const getLocationString = (location) => {
    if (!location) return 'N/A';
    
    // First priority: Check if we have a cached name from Google Maps API
    if (location.cachedName) {
      return location.cachedName;
    }
    
    // Second priority: Check if there's an address
    if (location.address) {
      return location.address;
    }
    
    // Third priority: Check if there's a name
    if (location.name) {
      return location.name;
    }
    
    // Fourth priority: Check for coordinates
    if (location.coordinates && Array.isArray(location.coordinates)) {
      // Instead of just showing a message, trigger geocoding (will be handled by useEffect)
      return 'Loading location...';
    }
    
    // Fifth priority: If location is just a string
    if (typeof location === 'string') {
      return location;
    }
    
    return 'N/A';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - List of rides */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Offered Rides</h2>
              <button
                onClick={() => navigate('/rides/create')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
              >
                + New Ride
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading your rides...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">{error}</p>
              </div>
            ) : myRides.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">You haven't offered any rides yet.</p>
                <button
                  onClick={() => navigate('/rides/create')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Offer a New Ride
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {myRides.map((ride) => {
                  const rideId = ride.id || ride._id;
                  const isSelected = rideId === selectedRideId;
                  const pendingCount = getPendingRequestsCount(ride);
                  
                  // Extract pickup/dropoff locations
                  const pickup = ride.pickupLocation?.coordinates || ['Unknown', 'Unknown'];
                  const dropoff = ride.dropoffLocation?.coordinates || ['Unknown', 'Unknown'];
                  
                  // Format for display (simplified for now)
                  const pickupDisplay = getLocationString(ride.pickupLocation);
                  const dropoffDisplay = getLocationString(ride.dropoffLocation);
                  
                  return (
                    <div
                      key={rideId}
                      onClick={() => handleRideSelect(ride)}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {formatDate(ride.departureTime || ride.time)}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                              {ride.status || 'active'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {ride.availableSeats || ride.seatsAvailable} seats available
                          </p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 text-gray-400" />
                            <span className="truncate max-w-full">{pickupDisplay} → {dropoffDisplay}</span>
                          </div>
                        </div>
                        
                        {pendingCount > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2 shrink-0">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Ride details and passenger requests - Only visible on larger screens */}
        <div className="lg:col-span-8 hidden lg:block">
          {selectedRide ? (
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200 h-full">
              {/* Ride details section */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">Ride Details</h2>
                  {selectedRide.status === 'active' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Edit Ride"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleCancelRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Cancel Ride"
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        onClick={() => handleCompleteRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Mark as Completed"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departure</h3>
                    <p className="mt-1 text-lg font-medium">
                      {formatDate(selectedRide.departureTime || selectedRide.time)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="mt-1 text-lg font-medium">
                      ${selectedRide.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Available Seats</h3>
                    <p className="mt-1 text-lg font-medium">
                      {selectedRide.availableSeats || selectedRide.seatsAvailable || 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className={`mt-1 inline-block px-2 py-0.5 rounded-md text-sm font-medium ${getStatusColor(selectedRide.status)}`}>
                      {selectedRide.status || 'active'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Car Details</h3>
                    <p className="mt-1 text-md">
                      {selectedRide.carModel || 'Not specified'} - {selectedRide.carNumber || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Preferences</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedRide.preferences?.smoking !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.smoking 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.smoking ? 'Smoking allowed' : 'No smoking'}
                        </span>
                      )}
                      {selectedRide.preferences?.pets !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.pets 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.pets ? 'Pets allowed' : 'No pets'}
                        </span>
                      )}
                      {selectedRide.preferences?.alcohol !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.alcohol 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.alcohol ? 'Alcohol allowed' : 'No alcohol'}
                        </span>
                      )}
                      {selectedRide.preferences?.gender && selectedRide.preferences.gender !== 'any' && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedRide.preferences.gender === 'male' ? 'Male passengers only' : 'Female passengers only'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Pickup Location</h3>
                  <p className="mt-1 text-md break-words flex items-start">
                    <MapPinIcon className="h-5 w-5 mt-0.5 mr-1.5 flex-shrink-0 text-primary" />
                    <span>{getLocationString(selectedRide.pickupLocation)}</span>
                  </p>
                  {selectedRide.pickupLocation?.coordinates && (
                    <div className="mt-1">
                      <span className="block text-xs text-gray-500 break-all">
                        Coordinates: [{selectedRide.pickupLocation.coordinates.join(', ')}]
                      </span>
                      
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-500">Dropoff Location</h3>
                  <p className="mt-1 text-md break-words flex items-start">
                    <MapPinIcon className="h-5 w-5 mt-0.5 mr-1.5 flex-shrink-0 text-red-500" />
                    <span>{getLocationString(selectedRide.dropoffLocation)}</span>
                  </p>
                  {selectedRide.dropoffLocation?.coordinates && (
                    <div className="mt-1">
                      <span className="block text-xs text-gray-500 break-all">
                        Coordinates: [{selectedRide.dropoffLocation.coordinates.join(', ')}]
                      </span>
                      
                    </div>
                  )}
                </div>
                
                {selectedRide.pickupLocation?.coordinates && selectedRide.dropoffLocation?.coordinates && (
                  <div className="mt-3 flex justify-center">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${
                        selectedRide.pickupLocation.coordinates[1]},${selectedRide.pickupLocation.coordinates[0]
                      }&destination=${
                        selectedRide.dropoffLocation.coordinates[1]},${selectedRide.dropoffLocation.coordinates[0]
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-primary hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-full sm:w-auto"
                    >
                      <span>View Full Route on Google Maps</span>
                    </a>
                  </div>
                )}
              </div>
              
              {/* Passenger requests section */}
              <div className="p-4 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Passenger Requests</h2>
                
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading requests...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No passenger requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => {
                      const userId = getUserId(request);
                      const name = getUserName(request);
                      const status = request.status || 'pending';
                      const initial = getUserInitial(request);
                      
                      return (
                        <div 
                          key={userId}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg flex-wrap gap-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <div className="mt-1">
                                {status === 'confirmed' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircleIcon className="mr-1 h-3 w-3 text-green-600" />
                                    Confirmed
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <XCircleIcon className="mr-1 h-3 w-3 text-red-600" />
                                    Rejected
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    <ClockIcon className="mr-1 h-3 w-3 text-yellow-600" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {status === 'pending' && selectedRide.status === 'active' && (
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handleRequestAction(userId, 'confirmed')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(userId, 'rejected')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 md:p-16 text-center">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No ride selected</h3>
              <p className="mt-1 text-gray-500">
                {myRides.length > 0 
                  ? 'Select a ride from the list to see details and passenger requests'
                  : 'Offer a ride to get started!'}
              </p>
              
              {myRides.length === 0 && (
                <button
                  onClick={() => navigate('/rides/create')}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Offer a New Ride
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Ride Details Modal */}
      {selectedRide && showMobileModal && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-y-auto">
          <div className="min-h-screen px-4 flex items-end justify-center sm:block">
            {/* Background overlay with animation */}
            <div 
              className="fixed inset-0 transition-opacity duration-300" 
              aria-hidden="true"
              onClick={closeMobileModal}
            >
              <div className="absolute inset-0 bg-gray-700 opacity-75 backdrop-blur-sm"></div>
            </div>
            
            {/* Modal panel with animation */}
            <div className="bg-white rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 ease-out w-full sm:max-w-lg sm:mx-auto max-h-[92vh] overflow-y-auto translate-y-0 sm:translate-y-0 animate-slide-up">
              {/* Modal header with close button */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Ride Details</h2>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={closeMobileModal}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              
              {/* Modal content - Ride Details */}
              <div className="p-5 bg-gradient-to-b from-gray-50 to-white">
                <div className="mb-5">
                  {selectedRide.status === 'active' && (
                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => handleEditRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-2 border border-gray-200 rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
                        title="Edit Ride"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleCancelRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-2 border border-gray-200 rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                        title="Cancel Ride"
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        onClick={() => handleCompleteRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-2 border border-gray-200 rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                        title="Mark as Completed"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Departure</h3>
                      <p className="mt-1 text-lg font-medium text-gray-800">
                        {formatDate(selectedRide.departureTime || selectedRide.time)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Price</h3>
                      <p className="mt-1 text-lg font-medium text-gray-800">
                        ${selectedRide.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Available Seats</h3>
                      <p className="mt-1 text-lg font-medium text-gray-800">
                        {selectedRide.availableSeats || selectedRide.seatsAvailable || 0}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRide.status)}`}>
                        {selectedRide.status || 'active'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Car Details</h3>
                    <p className="mt-1 text-md text-gray-800 font-medium">
                      {selectedRide.carModel || 'Not specified'} {selectedRide.carNumber ? `- ${selectedRide.carNumber}` : ''}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500">Preferences</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedRide.preferences?.smoking !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedRide.preferences.smoking 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {selectedRide.preferences.smoking ? 'Smoking allowed' : 'No smoking'}
                        </span>
                      )}
                      {selectedRide.preferences?.pets !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedRide.preferences.pets 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {selectedRide.preferences.pets ? 'Pets allowed' : 'No pets'}
                        </span>
                      )}
                      {selectedRide.preferences?.alcohol !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedRide.preferences.alcohol 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {selectedRide.preferences.alcohol ? 'Alcohol allowed' : 'No alcohol'}
                        </span>
                      )}
                      {selectedRide.preferences?.gender && selectedRide.preferences.gender !== 'any' && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {selectedRide.preferences.gender === 'male' ? 'Male passengers only' : 'Female passengers only'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Pickup Location</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-md break-words flex items-start text-gray-800">
                        <MapPinIcon className="h-5 w-5 mt-0.5 mr-1.5 flex-shrink-0 text-primary" />
                        <span>{getLocationString(selectedRide.pickupLocation)}</span>
                      </p>
                      {selectedRide.pickupLocation?.coordinates && (
                        <div className="mt-2 ml-6">
                          <span className="block text-xs text-gray-500 break-all">
                            Coordinates: [{selectedRide.pickupLocation.coordinates.join(', ')}]
                          </span>
                          
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Dropoff Location</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-md break-words flex items-start text-gray-800">
                        <MapPinIcon className="h-5 w-5 mt-0.5 mr-1.5 flex-shrink-0 text-red-500" />
                        <span>{getLocationString(selectedRide.dropoffLocation)}</span>
                      </p>
                      {selectedRide.dropoffLocation?.coordinates && (
                        <div className="mt-2 ml-6">
                          <span className="block text-xs text-gray-500 break-all">
                            Coordinates: [{selectedRide.dropoffLocation.coordinates.join(', ')}]
                          </span>
                          
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedRide.pickupLocation?.coordinates && selectedRide.dropoffLocation?.coordinates && (
                    <div className="mt-3 flex justify-center">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${
                          selectedRide.pickupLocation.coordinates[1]},${selectedRide.pickupLocation.coordinates[0]
                        }&destination=${
                          selectedRide.dropoffLocation.coordinates[1]},${selectedRide.dropoffLocation.coordinates[0]
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-primary hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-full sm:w-auto"
                      >
                        <span>View Full Route on Google Maps</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Passenger requests section */}
              <div className="p-5 border-t border-gray-200 bg-white">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Passenger Requests</h2>
                
                {requestsLoading ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2.5"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <p className="mt-4 text-gray-500">Loading requests...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No passenger requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => {
                      const userId = getUserId(request);
                      const name = getUserName(request);
                      const status = request.status || 'pending';
                      const initial = getUserInitial(request);
                      
                      return (
                        <div 
                          key={userId}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow flex-wrap gap-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                              {initial}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{name}</p>
                              <div className="mt-1">
                                {status === 'confirmed' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircleIcon className="mr-1 h-3 w-3 text-green-600" />
                                    Confirmed
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <XCircleIcon className="mr-1 h-3 w-3 text-red-600" />
                                    Rejected
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    <ClockIcon className="mr-1 h-3 w-3 text-yellow-600" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {status === 'pending' && selectedRide.status === 'active' && (
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handleRequestAction(userId, 'confirmed')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(userId, 'rejected')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Close button at the bottom for easier access on tall phones */}
              <div className="sticky bottom-0 p-4 border-t border-gray-200 flex justify-center bg-white shadow-inner">
                <button
                  onClick={closeMobileModal}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition-colors flex justify-center items-center space-x-1 shadow-sm"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 