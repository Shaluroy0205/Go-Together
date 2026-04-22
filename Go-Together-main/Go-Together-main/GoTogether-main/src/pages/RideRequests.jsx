import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ExclamationCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function RideRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationCache, setLocationCache] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get the Google Maps API key from environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fetch user's ride requests
  useEffect(() => {
    fetchRideRequests();
    
    // Force an immediate refresh after a short delay to get the most up-to-date status
    const initialRefreshTimeout = setTimeout(() => {
      refreshRideRequests();
    }, 3000);
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      refreshRideRequests();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
      clearTimeout(initialRefreshTimeout);
    };
  }, [user]);
  
  // Apply filters when requests or statusFilter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === statusFilter));
    }
  }, [requests, statusFilter]);

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

  // Effect to fetch and update locations for all requests
  useEffect(() => {
    const updateLocationNames = async () => {
      let updatedAnyLocation = false;
      
      const requestsWithUpdatedLocations = await Promise.all(
        requests.map(async (request) => {
          const ride = request.ride || request;
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
          
          // If ride was updated, update the request
          if (updatedRide !== ride) {
            return {
              ...request,
              ride: updatedRide
            };
          }
          
          return request;
        })
      );
      
      // Only update state if any locations were updated
      if (updatedAnyLocation) {
        setRequests(requestsWithUpdatedLocations);
      }
    };
    
    if (requests.length > 0 && GOOGLE_MAPS_API_KEY) {
      updateLocationNames();
    }
  }, [requests, getLocationNameFromCoordinates, GOOGLE_MAPS_API_KEY]);

  const fetchRideRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all rides the user has requested to join
      const response = await ridesApi.getUserRequests();
      console.log('User ride requests API response:', response);
      
      let userRequests = [];
      if (response.data && response.data.data) {
        userRequests = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userRequests = response.data;
      } else if (response.data) {
        userRequests = [response.data];
      }
      
      // Log the entire response to debug what we're getting from the API
      console.log('Complete user request response:', JSON.stringify(response.data));
      
      // Process each request to ensure status is correctly set
      const processedRequests = userRequests.map(request => {
        // Debug the structure of each request
        console.log('Processing request:', request.id || request._id, {
          directStatus: request.status,
          userRequestStatus: request.userRequestStatus,
          passengerInfo: request.passengers?.find(p => 
            (p.user === user.id) || 
            (p.user?._id === user.id) || 
            (p.user?.id === user.id)
          )
        });
        
        // Check for explicit userRequestStatus from the API (most reliable)
        if (request.userRequestStatus) {
          console.log(`Found userRequestStatus in API response: ${request.userRequestStatus}`);
          return {
            ...request,
            status: request.userRequestStatus
          };
        }
        
        // Check direct status if set to something other than pending
        if (request.status && request.status !== 'pending') {
          console.log(`Found direct status on request: ${request.status}`);
          return request;
        }
        
        // Check for the user's status in the passengers array
        if (request.passengers && Array.isArray(request.passengers)) {
          const userPassenger = request.passengers.find(p => {
            // Try different ways to match the user
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found user status in passengers array: ${userPassenger.status}`);
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Check in ride's passenger array (nested structure)
        if (request.ride && request.ride.passengers && Array.isArray(request.ride.passengers)) {
          const userPassenger = request.ride.passengers.find(
            p => (p.user === user.id || 
                 (p.user && p.user.id === user.id) || 
                 (p.user && p.user._id === user.id))
          );
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found user status in ride.passengers array: ${userPassenger.status}`);
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // If we still haven't found a status, make a direct API call for this specific ride
        // to get the most up-to-date status
        if (request.ride && (request.ride.id || request.ride._id)) {
          const rideId = request.ride.id || request.ride._id;
          console.log(`Making direct call to get status for ride: ${rideId}`);
          
          // We can't make the direct API call here since we're in a map function
          // Instead, mark it for refresh after this batch is processed
          setTimeout(() => {
            refreshSingleRideStatus(rideId);
          }, 100);
        }
        
        // Default to pending if no status found
        console.log('No definitive status found, defaulting to pending');
        return {
          ...request,
          status: 'pending'
        };
      });
      
      // Sort by most recent first
      processedRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.departureTime || a.time || 0);
        const dateB = new Date(b.createdAt || b.departureTime || b.time || 0);
        return dateB - dateA;
      });
      
      setRequests(processedRequests);
      
    } catch (error) {
      console.error('Failed to fetch ride requests:', error);
      let errorMessage = 'Failed to load your ride requests.';
      
      if (error.response) {
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
  
  // Function to refresh a single ride's status via direct API call
  const refreshSingleRideStatus = async (rideId) => {
    if (!rideId || refreshing || loading) return;
    
    try {
      console.log(`Refreshing single ride status for ride: ${rideId}`);
      const response = await ridesApi.getRideById(rideId);
      
      if (response.data && (response.data.data || response.data)) {
        const rideDetails = response.data.data || response.data;
        
        // Find the user in the passengers array
        if (rideDetails.passengers && Array.isArray(rideDetails.passengers)) {
          const userPassenger = rideDetails.passengers.find(p => {
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found updated status for ride ${rideId}: ${userPassenger.status}`);
            
            // Update the requests state
            setRequests(prevRequests => {
              return prevRequests.map(req => {
                if ((req.ride?.id === rideId || req.ride?._id === rideId || req.id === rideId || req._id === rideId) && req.status !== userPassenger.status) {
                  toast.success(`Ride request status updated to ${userPassenger.status}`);
                  return { ...req, status: userPassenger.status };
                }
                return req;
              });
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to refresh status for ride ${rideId}:`, error);
    }
  };

  // Refresh ride requests data silently (without loading indicator)
  const refreshRideRequests = async () => {
    if (!user || loading) return;
    
    try {
      setRefreshing(true);
      
      const response = await ridesApi.getUserRequests();
      console.log('Refreshed ride requests:', response);
      
      let userRequests = [];
      if (response.data && response.data.data) {
        userRequests = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userRequests = response.data;
      } else if (response.data) {
        userRequests = [response.data];
      }
      
      // Process each request with the same enhanced logic
      const processedRequests = userRequests.map(request => {
        // Check for explicit userRequestStatus from the API (most reliable)
        if (request.userRequestStatus) {
          return {
            ...request,
            status: request.userRequestStatus
          };
        }
        
        // Check direct status if set to something other than pending
        if (request.status && request.status !== 'pending') {
          return request;
        }
        
        // Check for the user's status in the passengers array
        if (request.passengers && Array.isArray(request.passengers)) {
          const userPassenger = request.passengers.find(p => {
            // Try different ways to match the user
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Check in ride's passenger array (nested structure)
        if (request.ride && request.ride.passengers && Array.isArray(request.ride.passengers)) {
          const userPassenger = request.ride.passengers.find(
            p => (p.user === user.id || 
                 (p.user && p.user.id === user.id) || 
                 (p.user && p.user._id === user.id))
          );
          
          if (userPassenger && userPassenger.status) {
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Schedule a targeted refresh for this ride
        if (request.ride && (request.ride.id || request.ride._id)) {
          const rideId = request.ride.id || request.ride._id;
          setTimeout(() => {
            refreshSingleRideStatus(rideId);
          }, 100);
        }
        
        // Default to pending if no status found
        return {
          ...request,
          status: 'pending'
        };
      });
      
      // Sort by most recent first
      processedRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.departureTime || a.time || 0);
        const dateB = new Date(b.createdAt || b.departureTime || b.time || 0);
        return dateB - dateA;
      });
      
      // Check if there are any status changes before updating
      const hasStatusChanges = JSON.stringify(processedRequests.map(r => ({
        id: r.id || r._id,
        status: r.status
      }))) !== JSON.stringify(requests.map(r => ({
        id: r.id || r._id,
        status: r.status
      })));
      
      if (hasStatusChanges) {
        setRequests(processedRequests);
        toast.success('Ride request status updated');
      } else {
        // No changes detected, just update the state without notification
        setRequests(processedRequests);
      }
      
    } catch (error) {
      console.error('Failed to refresh ride requests:', error);
      // Don't show error toast on silent refresh
    } finally {
      setRefreshing(false);
    }
  };

  // Handle canceling a ride request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.cancelRequest(requestId);
      
      toast.success('Ride request cancelled successfully');
      
      // Update local state to remove the cancelled request
      setRequests(prevRequests => 
        prevRequests.filter(req => (req.id || req._id) !== requestId)
      );
    } catch (error) {
      console.error('Failed to cancel ride request:', error);
      
      let errorMessage = 'Failed to cancel ride request.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
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

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5 text-gray-600" />;
      case 'pending':
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };
  
  // Format status text for display
  const formatStatusText = (status) => {
    switch(status) {
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  // Get driver name from ride
  const getDriverName = (ride) => {
    if (!ride) return 'Unknown Driver';
    
    if (ride.creator) {
      if (typeof ride.creator === 'string') {
        return 'Driver';
      } else if (ride.creator.firstName && ride.creator.lastName) {
        return `${ride.creator.firstName} ${ride.creator.lastName}`;
      } else if (ride.creator.name) {
        return ride.creator.name;
      } else if (ride.creator.username) {
        return ride.creator.username;
      }
    } else if (ride.driver) {
      if (typeof ride.driver === 'string') {
        return 'Driver';
      } else if (ride.driver.firstName && ride.driver.lastName) {
        return `${ride.driver.firstName} ${ride.driver.lastName}`;
      } else if (ride.driver.name) {
        return ride.driver.name;
      } else if (ride.driver.username) {
        return ride.driver.username;
      }
    }
    
    return 'Driver';
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

  // Force refresh all ride statuses by directly checking each ride
  const forceRefreshAllStatuses = async () => {
    if (!user || refreshing || loading || requests.length === 0) return;
    
    try {
      setRefreshing(true);
      toast.loading('Checking latest status for all rides...');
      
      // Create a copy of the requests to update
      const updatedRequests = [...requests];
      let statusChanged = false;
      
      // Process each ride with a direct API call to get current status
      for (let i = 0; i < updatedRequests.length; i++) {
        const request = updatedRequests[i];
        const rideId = request.ride?.id || request.ride?._id || request.id || request._id;
        
        if (rideId) {
          try {
            const response = await ridesApi.getRideById(rideId);
            const rideDetails = response.data.data || response.data;
            
            if (rideDetails && rideDetails.passengers && Array.isArray(rideDetails.passengers)) {
              const userPassenger = rideDetails.passengers.find(p => {
                const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
                return passengerId === user.id || passengerId === user._id;
              });
              
              if (userPassenger && userPassenger.status && userPassenger.status !== request.status) {
                console.log(`Status updated for ride ${rideId}: ${request.status} → ${userPassenger.status}`);
                updatedRequests[i] = {
                  ...request,
                  status: userPassenger.status
                };
                statusChanged = true;
              }
            }
          } catch (error) {
            console.error(`Error checking ride ${rideId}:`, error);
          }
        }
      }
      
      // Update state if any statuses changed
      if (statusChanged) {
        setRequests(updatedRequests);
        toast.success('Ride statuses updated successfully');
      } else {
        toast.success('All ride statuses are already up to date');
      }
      
    } catch (error) {
      console.error('Error in force refresh:', error);
      toast.error('Failed to refresh ride statuses');
    } finally {
      setRefreshing(false);
      toast.dismiss();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">My Ride Requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your ride requests
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-500">Loading your ride requests...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-2 text-red-500">{error}</p>
          <button 
            onClick={fetchRideRequests}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">You haven't made any ride requests yet.</p>
          <button 
            onClick={() => navigate('/rides')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Find Rides
          </button>
        </div>
      ) : (
        <div>
          {/* Filter bar - Collapsible on mobile */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 md:hidden"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>Filters</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} />
              </button>
              
              {/* Always visible on md screens and up */}
              <div className="hidden md:flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Confirmed
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <XCircleIcon className="h-3.5 w-3.5" />
                  Rejected
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={forceRefreshAllStatuses}
                  disabled={refreshing || loading || requests.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition-colors"
                  title="Check latest status from server for all rides"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
            
            {/* Mobile filters - Collapsible */}
            <div className={`mt-3 md:hidden transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-wrap gap-2 py-2">
                <span className="text-sm font-medium text-gray-700 w-full">Filter by status:</span>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Requests
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Confirmed
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <XCircleIcon className="h-3.5 w-3.5" />
                  Rejected
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop view - Table (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ride Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seats
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const requestId = request.id || request._id;
                  const ride = request.ride || request;
                  const rideId = ride.id || ride._id;
                  const status = request.status || 'pending';
                  
                  // Get ride details
                  const departureTime = formatDate(ride.departureTime || ride.time);
                  const driverName = getDriverName(ride);
                  const seats = ride.availableSeats || ride.seatsAvailable || 0;
                  const price = ride.price?.toFixed(2) || '0.00';
                  
                  // Get location details
                  const pickup = getLocationString(ride.pickupLocation);
                  const dropoff = getLocationString(ride.dropoffLocation);
                  
                  return (
                    <tr key={requestId} className={`hover:bg-gray-50 ${
                      status === 'confirmed' ? 'bg-green-50/30' : 
                      status === 'rejected' ? 'bg-red-50/30' : 
                      status === 'cancelled' ? 'bg-gray-50/50' : 
                      ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{departureTime}</div>
                        <div className="text-sm text-gray-500 flex items-start">
                          <MapPinIcon className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0 text-gray-400" />
                          <span>{pickup} → {dropoff}</span>
                        </div>
                        {(ride.pickupLocation?.coordinates || ride.dropoffLocation?.coordinates) && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&origin=${
                              ride.pickupLocation?.coordinates ? `${ride.pickupLocation.coordinates[1]},${ride.pickupLocation.coordinates[0]}` : ''
                            }&destination=${
                              ride.dropoffLocation?.coordinates ? `${ride.dropoffLocation.coordinates[1]},${ride.dropoffLocation.coordinates[0]}` : ''
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary/80 inline-flex items-center mt-1"
                          >
                            <span>View route on Google Maps</span>
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border ${getStatusBadgeClass(status)}`}>
                            {getStatusIcon(status)}
                            {formatStatusText(status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{driverName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {seats}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        ${price}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => navigate(`/rides/${rideId}`)}
                            className="text-primary hover:text-primary/80"
                          >
                            View
                          </button>
                          
                          {status === 'pending' && (
                            <button
                              onClick={() => handleCancelRequest(request.id || request._id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-800 flex items-center"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view - Cards (visible on mobile only) */}
          <div className="md:hidden">
            {filteredRequests.map((request) => {
              const requestId = request.id || request._id;
              const ride = request.ride || request;
              const rideId = ride.id || ride._id;
              const status = request.status || 'pending';
              
              // Get ride details
              const departureTime = formatDate(ride.departureTime || ride.time);
              const driverName = getDriverName(ride);
              const seats = ride.availableSeats || ride.seatsAvailable || 0;
              const price = ride.price?.toFixed(2) || '0.00';
              
              // Get location details
              const pickup = getLocationString(ride.pickupLocation);
              const dropoff = getLocationString(ride.dropoffLocation);
              
              return (
                <div 
                  key={requestId} 
                  className={`p-4 border-b ${
                    status === 'confirmed' ? 'bg-green-50/30' : 
                    status === 'rejected' ? 'bg-red-50/30' : 
                    status === 'cancelled' ? 'bg-gray-50/50' : 
                    ''
                  }`}
                >
                  {/* Status badge at the top */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusBadgeClass(status)}`}>
                      {getStatusIcon(status)}
                      {formatStatusText(status)}
                    </span>
                    
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-500" />
                      ${price}
                    </div>
                  </div>
                  
                  {/* Departure time */}
                  <div className="flex items-center text-sm font-medium text-gray-900 mb-2">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {departureTime}
                  </div>
                  
                  {/* Locations */}
                  <div className="flex mb-3">
                    <MapPinIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-gray-500" />
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{pickup}</div>
                      <div className="h-4 border-l-2 border-dashed border-gray-300 ml-1.5 my-1"></div>
                      <div>{dropoff}</div>
                    </div>
                  </div>
                  
                  {/* Driver & Seats */}
                  <div className="flex justify-between text-sm mb-3">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="text-gray-700">{driverName}</span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="text-gray-700">{seats} seats</span>
                    </div>
                  </div>
                  
                  {/* Map link */}
                  {(ride.pickupLocation?.coordinates || ride.dropoffLocation?.coordinates) && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${
                        ride.pickupLocation?.coordinates ? `${ride.pickupLocation.coordinates[1]},${ride.pickupLocation.coordinates[0]}` : ''
                      }&destination=${
                        ride.dropoffLocation?.coordinates ? `${ride.dropoffLocation.coordinates[1]},${ride.dropoffLocation.coordinates[0]}` : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 inline-flex items-center mb-3"
                    >
                      <span>View route on Google Maps</span>
                    </a>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/rides/${rideId}`)}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                    
                    {status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(request.id || request._id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} requests found.</p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-primary hover:text-primary/80"
                >
                  Show all requests
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 