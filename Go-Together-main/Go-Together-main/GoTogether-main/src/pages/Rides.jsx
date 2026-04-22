import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import GoogleMapPicker from '../components/GoogleMapPicker';
import LocationSearchBox from '../components/LocationSearchBox';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({
    seats: '',
    priceMin: '',
    priceMax: '',
    searchQuery: '',
    sortBy: 'departureTime',
    sortDirection: 'asc',
    pickupLat: '',
    pickupLng: '',
    dropoffLat: '',
    dropoffLng: '',
    maxDistance: '5000', // Default max distance in meters
    pickupAddress: '',
    dropoffAddress: ''
  });
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDropoffMap, setShowDropoffMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();

    // Detect if the device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check initially
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all available rides
      const response = await ridesApi.getAllRides();
      console.log('All rides response:', response);
      
      let allRides = [];
      if (response.data && response.data.data) {
        allRides = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        allRides = response.data;
      }
      
      // Filter out rides with status other than active
      allRides = allRides.filter(ride => !ride.status || ride.status === 'active');
      
      // Sort by departure time (default)
      allRides.sort((a, b) => {
        const dateA = new Date(a.departureTime || a.time || 0);
        const dateB = new Date(b.departureTime || b.time || 0);
        return dateA - dateB;
      });
      
      // Convert coordinates to addresses for each ride
      await enrichRidesWithAddresses(allRides);
      
      setRides(allRides);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      
      let errorMessage = 'Failed to load rides.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Convert coordinates to addresses for all rides
  const enrichRidesWithAddresses = async (rides) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const geocodePromises = [];
    
    // Process each ride's pickup and dropoff locations
    rides.forEach(ride => {
      // Process pickup location
      if (ride.pickupLocation && ride.pickupLocation.coordinates && 
          Array.isArray(ride.pickupLocation.coordinates) && 
          !ride.pickupLocation.address) {
        
        const [lng, lat] = ride.pickupLocation.coordinates;
        
        if (lat && lng) {
          const promise = fetchAddressFromCoordinates(lat, lng)
            .then(address => {
              if (address) {
                if (!ride.pickupLocation.address) {
                  ride.pickupLocation.address = address;
                }
              }
            })
            .catch(err => console.error('Error getting pickup address:', err));
          
          geocodePromises.push(promise);
        }
      }
      
      // Process dropoff location
      if (ride.dropoffLocation && ride.dropoffLocation.coordinates && 
          Array.isArray(ride.dropoffLocation.coordinates) && 
          !ride.dropoffLocation.address) {
        
        const [lng, lat] = ride.dropoffLocation.coordinates;
        
        if (lat && lng) {
          const promise = fetchAddressFromCoordinates(lat, lng)
            .then(address => {
              if (address) {
                if (!ride.dropoffLocation.address) {
                  ride.dropoffLocation.address = address;
                }
              }
            })
            .catch(err => console.error('Error getting dropoff address:', err));
          
          geocodePromises.push(promise);
        }
      }
    });
    
    // Wait for all geocoding operations to complete
    try {
      await Promise.all(geocodePromises);
    } catch (error) {
      console.error('Error enriching rides with addresses:', error);
    }
  };

  // Helper function to get address from coordinates using Google Maps Geocoding API
  const fetchAddressFromCoordinates = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Check if location coordinates are provided for location-based search
    if (
      filters.pickupLat && 
      filters.pickupLng && 
      filters.dropoffLat && 
      filters.dropoffLng
    ) {
      try {
        setSearchLoading(true);
        setError(null);
        
        // Prepare search data with addresses if available
        const searchData = {
          pickupLat: parseFloat(filters.pickupLat),
          pickupLng: parseFloat(filters.pickupLng),
          dropoffLat: parseFloat(filters.dropoffLat),
          dropoffLng: parseFloat(filters.dropoffLng),
          maxDistance: parseInt(filters.maxDistance),
          pickupAddress: filters.pickupAddress,
          dropoffAddress: filters.dropoffAddress
        };
        
        // Use the bestRides endpoint for location-based search
        const response = await ridesApi.getBestMatches(searchData);
        
        console.log('Best matching rides response:', response);
        
        let bestRides = [];
        if (response.data && response.data.data) {
          bestRides = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          bestRides = response.data;
        }

        // Convert coordinates to addresses for the matching rides
        await enrichRidesWithAddresses(bestRides);
        
        setRides(bestRides);
        toast.success(`Found ${bestRides.length} matching rides`);
      } catch (error) {
        console.error('Failed to fetch best rides:', error);
        let errorMessage = 'Failed to find matching rides.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setSearchLoading(false);
      }
    } else {
      // If no location coordinates, just apply client-side filters
      console.log('Applying client-side filters only');
      // Filtering is done in the filteredRides variable
      toast.success(`Filters applied: ${filteredRides.length} rides match your criteria`);
    }
  };

  const handleRideClick = (rideId) => {
    navigate(`/rides/${rideId}`);
  };

  const handlePostRide = () => {
    navigate('/rides/create');
  };
  
  const getCurrentLocation = (type) => {
    if (navigator.geolocation) {
      const loadingToast = toast.loading('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (type === 'pickup') {
            setFilters(prev => ({
              ...prev,
              pickupLat: latitude.toString(),
              pickupLng: longitude.toString(),
            }));
            setShowPickupMap(true);
            toast.dismiss(loadingToast);
            toast.success('Pickup location set to your current location');
          } else if (type === 'dropoff') {
            setFilters(prev => ({
              ...prev,
              dropoffLat: latitude.toString(),
              dropoffLng: longitude.toString(),
            }));
            setShowDropoffMap(true);
            toast.dismiss(loadingToast);
            toast.success('Dropoff location set to your current location');
          }

          // Try to get the address using reverse geocoding
          fetchAddressForCurrentLocation(latitude, longitude, type);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.dismiss(loadingToast);
          toast.error('Could not get your location. Please enter coordinates manually.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  // Specialized helper function for current location address lookup
  const fetchAddressForCurrentLocation = async (lat, lng, type) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        
        if (type === 'pickup') {
          setFilters(prev => ({
            ...prev,
            pickupAddress: address
          }));
        } else if (type === 'dropoff') {
          setFilters(prev => ({
            ...prev,
            dropoffAddress: address
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  // Handle map closing from the GoogleMapPicker component
  const handleMapClose = (type) => {
    if (type === 'pickup') {
      setShowPickupMap(false);
    } else {
      setShowDropoffMap(false);
    }
    
    // Ensure scrolling is restored
    document.body.style.overflow = '';
  };

  const openGoogleMaps = (type) => {
    // For mobile, we'll use the fullscreen map experience
    if (type === 'pickup') {
      // Toggle map visibility
      setShowPickupMap(!showPickupMap);
      
      // Show a hint to the user if opening map without coordinates on non-mobile
      if (!showPickupMap && !filters.pickupLat && !filters.pickupLng && !isMobile) {
        toast.info('Please select a pickup location on the map or use your current location.');
      }
      
      // On mobile, we want to prevent scrolling of the background when map is open
      if (isMobile && !showPickupMap) {
        document.body.style.overflow = 'hidden';
      } else if (isMobile) {
        document.body.style.overflow = '';
      }
    } else {
      // Toggle map visibility
      setShowDropoffMap(!showDropoffMap);
      
      // Show a hint to the user if opening map without coordinates on non-mobile
      if (!showDropoffMap && !filters.dropoffLat && !filters.dropoffLng && !isMobile) {
        toast.info('Please select a dropoff location on the map or use your current location.');
      }
      
      // On mobile, we want to prevent scrolling of the background when map is open
      if (isMobile && !showDropoffMap) {
        document.body.style.overflow = 'hidden';
      } else if (isMobile) {
        document.body.style.overflow = '';
      }
    }
  };

  // Handle location selection from map or search
  const handleLocationSelect = async (location, type) => {
    // Update coordinates immediately
    if (type === 'pickup') {
      setFilters(prev => ({
        ...prev,
        pickupLat: location.lat.toString(),
        pickupLng: location.lng.toString(),
        // Keep existing address if one was provided (e.g., from search)
        pickupAddress: location.address || prev.pickupAddress
      }));
    } else if (type === 'dropoff') {
      setFilters(prev => ({
        ...prev,
        dropoffLat: location.lat.toString(),
        dropoffLng: location.lng.toString(),
        // Keep existing address if one was provided (e.g., from search)
        dropoffAddress: location.address || prev.dropoffAddress
      }));
    }
    
    // If no address was provided (e.g., from map click), fetch it
    if (!location.address) {
      try {
        // Show loading indicator
        const loadingToast = toast.loading(`Fetching address for ${type} location...`);
        
        // Fetch address from coordinates
        const address = await fetchAddressFromCoordinates(location.lat, location.lng);
        
        // Update the address in state
        if (address) {
          if (type === 'pickup') {
            setFilters(prev => ({
              ...prev,
              pickupAddress: address
            }));
          } else if (type === 'dropoff') {
            setFilters(prev => ({
              ...prev,
              dropoffAddress: address
            }));
          }
          toast.dismiss(loadingToast);
          toast.success(`${type === 'pickup' ? 'Pickup' : 'Dropoff'} address found`);
        } else {
          toast.dismiss(loadingToast);
          toast.error(`Couldn't find address for the selected location`);
        }
      } catch (error) {
        console.error('Error in handleLocationSelect:', error);
        toast.error(`Error retrieving address for ${type} location`);
      }
    }
  };

  // Apply filters to rides
  const filteredRides = rides.filter(ride => {
    // Filter by seats
    if (filters.seats && (ride.availableSeats < parseInt(filters.seats) || ride.seatsAvailable < parseInt(filters.seats))) {
      return false;
    }
    
    // Filter by price
    if (filters.priceMin && ride.price < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && ride.price > parseFloat(filters.priceMax)) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      
      // Search in pickup and dropoff locations
      const pickup = getLocationString(ride.pickupLocation).toLowerCase();
      const dropoff = getLocationString(ride.dropoffLocation).toLowerCase();
      
      // Search in car model
      const carModel = (ride.carModel || '').toLowerCase();
      
      // Search in driver name
      let driverName = '';
      if (ride.creator) {
        if (typeof ride.creator !== 'string') {
          driverName = [
            ride.creator.firstName,
            ride.creator.lastName,
            ride.creator.name,
            ride.creator.username
          ].filter(Boolean).join(' ').toLowerCase();
        }
      }
      
      // Check if any fields contain the search query
      if (!pickup.includes(query) && 
          !dropoff.includes(query) && 
          !carModel.includes(query) && 
          !driverName.includes(query)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    const sortKey = filters.sortBy || 'departureTime';
    const direction = filters.sortDirection === 'desc' ? -1 : 1;
    
    if (sortKey === 'departureTime') {
      const dateA = new Date(a.departureTime || a.time || 0);
      const dateB = new Date(b.departureTime || b.time || 0);
      return (dateA - dateB) * direction;
    } else if (sortKey === 'price') {
      return ((a.price || 0) - (b.price || 0)) * direction;
    } else if (sortKey === 'seats') {
      const seatsA = a.availableSeats || a.seatsAvailable || 0;
      const seatsB = b.availableSeats || b.seatsAvailable || 0;
      return (seatsA - seatsB) * direction;
    }
    
    return 0;
  });

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      // Format: "Mon, Mar 30, 2024 at 10:00 AM"
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
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

  // Get driver name from ride
  const getDriverName = (ride) => {
    if (!ride || !ride.creator) return 'Driver';
    
    if (typeof ride.creator === 'string') {
      return 'Driver';
    } else if (ride.creator.firstName && ride.creator.lastName) {
      return `${ride.creator.firstName} ${ride.creator.lastName}`;
    } else if (ride.creator.name) {
      return ride.creator.name;
    } else if (ride.creator.username) {
      return ride.creator.username;
    }
    
    return 'Driver';
  };

  // Get location string
  const getLocationString = (location) => {
    if (!location) return 'N/A';
    
    // First priority: Check if there's an address
    if (location.address) {
      return location.address;
    }
    
    // Second priority: Check if there's a name
    if (location.name) {
      return location.name;
    }
    
    // Third priority: Check for coordinates
    if (location.coordinates && Array.isArray(location.coordinates)) {
      // Don't display raw coordinates to the user, show a more friendly message
      return 'Location coordinates available';
    }
    
    // Fourth priority: If location is just a string
    if (typeof location === 'string') {
      return location;
    }
    
    return 'Location';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Header with "GoTogether" logo */}
      <div className="relative bg-indigo-700 rounded-xl p-0.5 mb-0 text-white shadow-lg">
        
      </div>
      
      {/* Main container */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pickup Location */}
            <div>
              <div className="mb-2">
                <h3 className="text-lg font-medium text-gray-900">Pickup Location</h3>
                <p className="text-sm text-gray-500">Where would you like to be picked up?</p>
              </div>
              
              {/* Google Maps location search */}
              <div className="mb-4">
                <LocationSearchBox 
                  onPlaceSelect={handleLocationSelect}
                  placeholder="Search for pickup location"
                  type="pickup"
                />
              </div>
              
              {showPickupMap && (
                <div className={`${isMobile ? 'absolute inset-0 z-50' : 'mb-4'}`}>
                  <GoogleMapPicker
                    initialPosition={
                      filters.pickupLat && filters.pickupLng
                        ? {
                            lat: parseFloat(filters.pickupLat),
                            lng: parseFloat(filters.pickupLng)
                          }
                        : null
                    }
                    onLocationSelect={handleLocationSelect}
                    type="pickup"
                    isMobile={isMobile}
                    onClose={isMobile ? () => handleMapClose('pickup') : undefined}
                  />
                </div>
              )}
              
              {filters.pickupAddress && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected Address:</span> {filters.pickupAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: [{filters.pickupLng}, {filters.pickupLat}]
                  </p>
                </div>
              )}
              
              {/* Show coordinates even if we don't have an address yet */}
              {!filters.pickupAddress && filters.pickupLat && filters.pickupLng && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Location selected on map</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: [{filters.pickupLng}, {filters.pickupLat}]
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => getCurrentLocation('pickup')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
                >
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={() => openGoogleMaps('pickup')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
                >
                  {showPickupMap ? (
                    <>
                      Close Map
                      <ArrowRightIcon className="h-3 w-3 ml-1 transform rotate-90" />
                    </>
                  ) : (
                    <>
                      Open Map
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Dropoff Location */}
            <div>
              <div className="mb-2">
                <h3 className="text-lg font-medium text-gray-900">Dropoff Location</h3>
                <p className="text-sm text-gray-500">Where would you like to go?</p>
              </div>
              
              {/* Google Maps location search */}
              <div className="mb-4">
                <LocationSearchBox 
                  onPlaceSelect={handleLocationSelect}
                  placeholder="Search for dropoff location"
                  type="dropoff"
                />
              </div>
              
              {showDropoffMap && (
                <div className={`${isMobile ? 'absolute inset-0 z-50' : 'mb-4'}`}>
                  <GoogleMapPicker
                    initialPosition={
                      filters.dropoffLat && filters.dropoffLng
                        ? {
                            lat: parseFloat(filters.dropoffLat),
                            lng: parseFloat(filters.dropoffLng)
                          }
                        : null
                    }
                    onLocationSelect={handleLocationSelect}
                    type="dropoff"
                    isMobile={isMobile}
                    onClose={isMobile ? () => handleMapClose('dropoff') : undefined}
                  />
                </div>
              )}
              
              {filters.dropoffAddress && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected Address:</span> {filters.dropoffAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: [{filters.dropoffLng}, {filters.dropoffLat}]
                  </p>
                </div>
              )}
              
              {/* Show coordinates even if we don't have an address yet */}
              {!filters.dropoffAddress && filters.dropoffLat && filters.dropoffLng && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Location selected on map</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: [{filters.dropoffLng}, {filters.dropoffLat}]
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => getCurrentLocation('dropoff')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
                >
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={() => openGoogleMaps('dropoff')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
                >
                  {showDropoffMap ? (
                    <>
                      Close Map
                      <ArrowRightIcon className="h-3 w-3 ml-1 transform rotate-90" />
                    </>
                  ) : (
                    <>
                      Open Map
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Search button */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={searchLoading || !filters.pickupLat || !filters.pickupLng || !filters.dropoffLat || !filters.dropoffLng}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-700 text-white text-lg font-medium rounded-lg shadow-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {searchLoading ? (
                <span className="inline-flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-r-transparent rounded-full"></span>
                  Searching...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Find Rides
                </span>
              )}
            </button>
          </div>
          
          {/* Additional filters (hidden by default, can be toggled) */}
          <div className="mt-4">
            <details className="group">
              <summary className="flex items-center text-sm font-medium text-indigo-700 cursor-pointer">
                <span>Advanced Filters</span>
                <span className="ml-1 transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                {/* Min Seats */}
                <div>
                  <label htmlFor="seats" className="block text-sm font-medium text-gray-700">Min Seats</label>
                  <select
                    id="seats"
                    name="seats"
                    value={filters.seats}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                
                {/* Min Price */}
                <div>
                  <label htmlFor="priceMin" className="block text-sm font-medium text-gray-700">Min Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="priceMin"
                      id="priceMin"
                      value={filters.priceMin}
                      onChange={handleFilterChange}
                      className="focus:ring-indigo-700 focus:border-indigo-700 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Min"
                    />
                  </div>
                </div>
                
                {/* Max Price */}
                <div>
                  <label htmlFor="priceMax" className="block text-sm font-medium text-gray-700">Max Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="priceMax"
                      id="priceMax"
                      value={filters.priceMax}
                      onChange={handleFilterChange}
                      className="focus:ring-indigo-700 focus:border-indigo-700 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                {/* Max Distance */}
                <div>
                  <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700">
                    Max Distance: {parseInt(filters.maxDistance)/1000} km
                  </label>
                  <input
                    type="range"
                    id="maxDistance"
                    name="maxDistance"
                    min="1000"
                    max="20000"
                    step="1000"
                    value={filters.maxDistance}
                    onChange={handleFilterChange}
                    className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Sort controls */}
              <div className="mt-4 flex flex-wrap gap-4 items-end border-t border-gray-200 pt-4">
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
                  <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm"
                  >
                    <option value="departureTime">Departure Time</option>
                    <option value="price">Price</option>
                    <option value="seats">Available Seats</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700">Order</label>
                  <select
                    id="sortDirection"
                    name="sortDirection"
                    value={filters.sortDirection}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                <div className="flex-grow"></div>
                <button
                  type="button"
                  onClick={() => setFilters({
                    seats: '',
                    priceMin: '',
                    priceMax: '',
                    searchQuery: '',
                    sortBy: 'departureTime',
                    sortDirection: 'asc',
                    pickupLat: '',
                    pickupLng: '',
                    dropoffLat: '',
                    dropoffLng: '',
                    maxDistance: '5000'
                  })}
                  className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
                >
                  Reset All Filters
                </button>
              </div>
            </details>
          </div>
        </form>
      </div>
      
      {/* Available Rides heading */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Rides</h2>
        
        <div className="text-sm text-gray-500">
          {!loading && !error && filteredRides.length > 0 && (
            <span>Found {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'}</span>
          )}
        </div>
      </div>
      
      {/* Rides list */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available rides...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-2 text-red-500">{error}</p>
            <button 
              onClick={fetchRides}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-700">
              {filters.searchQuery || filters.seats || filters.priceMin || filters.priceMax ||
               filters.pickupLat || filters.dropoffLat
                ? 'No rides match your search criteria.'
                : 'No rides available at the moment.'}
            </p>
            <button 
              onClick={() => setFilters({
                seats: '',
                priceMin: '',
                priceMax: '',
                searchQuery: '',
                sortBy: 'departureTime',
                sortDirection: 'asc',
                pickupLat: '',
                pickupLng: '',
                dropoffLat: '',
                dropoffLng: '',
                maxDistance: '5000'
              })}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {filteredRides.map((ride) => {
              const rideId = ride.id || ride._id;
              const pickup = getLocationString(ride.pickupLocation);
              const dropoff = getLocationString(ride.dropoffLocation);
              const departureTime = formatDate(ride.departureTime || ride.time);
              const driverName = getDriverName(ride);
              const driverFirstName = ride.creator?.firstName || 'D';
              const driverLastName = ride.creator?.lastName || '';
              const price = ride.price?.toFixed(2) || '0.00';
              const seats = ride.availableSeats || ride.seatsAvailable || 0;
              
              return (
                <div
                  key={rideId}
                  onClick={() => handleRideClick(rideId)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                >
                  {/* Unified responsive card design */}
                  {/* Header with price and driver info */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 md:p-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm md:text-base font-semibold mr-2 md:mr-3">
                        {driverFirstName.charAt(0)}{driverLastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-medium leading-tight">{driverName}</p>
                        <div className="flex items-center">
                          <UsersIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-500 mr-1" />
                          <p className="text-xs md:text-sm text-gray-500">{seats} seat{seats !== 1 ? 's' : ''} available</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg md:text-2xl font-bold text-indigo-700">${price}</div>
                      <p className="text-xs text-gray-500">per seat</p>
                    </div>
                  </div>
                  
                  {/* Route information */}
                  <div className="p-3 md:p-4">
                    <div className="flex mb-3">
                      <div className="mr-3 md:mr-4 relative" style={{ width: '10px', minHeight: '80px' }}>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 z-10"></div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2.5 w-0.5 h-full bg-gray-300"></div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 z-10"></div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                        <div className="bg-gray-50 rounded-md p-2 md:p-3 mb-3">
                          <p className="text-xs md:text-sm text-gray-500 mb-0.5">From</p>
                          <p className="text-sm md:text-base font-medium md:hidden truncate">{pickup.split(',')[0]}</p>
                          <p className="hidden md:block text-base font-medium">{pickup}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2 md:p-3">
                          <p className="text-xs md:text-sm text-gray-500 mb-0.5">To</p>
                          <p className="text-sm md:text-base font-medium md:hidden truncate">{dropoff.split(',')[0]}</p>
                          <p className="hidden md:block text-base font-medium">{dropoff}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time information */}
                    <div className="flex flex-wrap md:flex-nowrap items-center justify-between bg-gray-50 rounded-md p-2 md:p-3 mt-3">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 rounded-full p-1 md:p-1.5 mr-2 md:mr-3">
                          <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 text-indigo-700" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-500">Departure</p>
                          <p className="text-sm md:text-base font-medium">
                            {new Date(ride.departureTime || ride.time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} • {new Date(ride.departureTime || ride.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      
                      {/* Show distance if available from bestMatches API - Desktop only */}
                      {ride.pickupDistance && (
                        <div className="hidden md:block text-xs text-gray-500 mx-4">
                          <span className="font-medium">Distance:</span> Pickup {(ride.pickupDistance/1000).toFixed(1)}km • Dropoff {(ride.dropoffDistance/1000).toFixed(1)}km
                        </div>
                      )}
                      
                      <Link 
                        to={`/rides/${rideId}`}
                        className="flex items-center text-xs md:text-sm font-medium text-indigo-700 bg-white rounded-full py-1 px-2 md:py-1.5 md:px-3 shadow-sm mt-2 md:mt-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Details
                        <ArrowRightIcon className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                      </Link>
                    </div>
                  </div>

                  {ride.status === 'confirmed' && (
                    <div className="bg-green-100 px-6 py-2 text-center text-sm font-medium text-green-800">
                      Confirmed
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
      
      {/* Mobile floating action button for offering rides */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button
          onClick={handlePostRide}
          className="h-14 w-14 rounded-full bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
} 