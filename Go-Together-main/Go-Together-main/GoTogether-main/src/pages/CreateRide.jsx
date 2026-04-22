import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { rides } from '../services/api';

import { toast } from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';

import { MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

import GoogleMapPicker from '../components/GoogleMapPicker';

import LocationSearchBox from '../components/LocationSearchBox';



export default function CreateRide() {

  const [formData, setFormData] = useState({

    carModel: '',

    carNumber: '',

    pickupLocation: {

      type: 'Point',

      coordinates: ['', ''], // [longitude, latitude]

      address: ''

    },

    dropoffLocation: {

      type: 'Point',

      coordinates: ['', ''], // [longitude, latitude]

      address: ''

    },

    time: '',

    seatsAvailable: '',

    price: '',

    smokingAllowed: false,

    petsAllowed: false,

    alcoholAllowed: false,

    genderPreference: 'any',

  });



  const [showPickupMap, setShowPickupMap] = useState(false);

  const [showDropoffMap, setShowDropoffMap] = useState(false);

  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();

  const { user } = useAuth();



  // Detect if the device is mobile

  useEffect(() => {

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

  

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    

    if (name.startsWith('pickup') || name.startsWith('dropoff')) {

      const [location, coord, index] = name.split('_');

      setFormData((prev) => ({

        ...prev,

        [`${location}Location`]: {

          ...prev[`${location}Location`],

          coordinates: prev[`${location}Location`].coordinates.map((c, i) =>

            i === parseInt(index) ? value : c

          ),

        },

      }));

    } else {

      setFormData((prev) => ({

        ...prev,

        [name]: type === 'checkbox' ? checked : value,

      }));

    }

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!user) {

      toast.error('You must be logged in to create rides');

      return;

    }



    // Validate that coordinates are set through map selection

    if (!formData.pickupLocation.coordinates[0] || !formData.pickupLocation.coordinates[1]) {

      toast.error('Please select a pickup location using the map');

      return;

    }



    if (!formData.dropoffLocation.coordinates[0] || !formData.dropoffLocation.coordinates[1]) {

      toast.error('Please select a dropoff location using the map');

      return;

    }



    setLoading(true);

    try {

      await rides.create(formData);

      toast.success('Ride created successfully!');

      navigate('/my-rides');

    } catch (error) {

      toast.error(error.response?.data?.message || 'Failed to create ride');

    } finally {

      setLoading(false);

    }

  };



  const openGoogleMaps = (type) => {

    // Toggle map visibility

    if (type === 'pickup') {

      const newState = !showPickupMap;

      setShowPickupMap(newState);

      

      // On mobile, we want to prevent scrolling of the background when map is open

      if (isMobile && newState) {

        document.body.style.overflow = 'hidden';

      } else if (isMobile) {

        document.body.style.overflow = '';

      }

      

      // Show a hint to the user if opening map without coordinates on non-mobile

      if (newState && !formData.pickupLocation.coordinates[0] && !formData.pickupLocation.coordinates[1] && !isMobile) {

        toast.info('Please select a pickup location on the map or use your current location.');

      }

    } else if (type === 'dropoff') {

      const newState = !showDropoffMap;

      setShowDropoffMap(newState);

      

      // On mobile, we want to prevent scrolling of the background when map is open

      if (isMobile && newState) {

        document.body.style.overflow = 'hidden';

      } else if (isMobile) {

        document.body.style.overflow = '';

      }

      

      // Show a hint to the user if opening map without coordinates on non-mobile

      if (newState && !formData.dropoffLocation.coordinates[0] && !formData.dropoffLocation.coordinates[1] && !isMobile) {

        toast.info('Please select a dropoff location on the map or use your current location.');

      }

    }

  };



  // Function to get current location

  const getCurrentLocation = (type) => {

    if (navigator.geolocation) {

      const loadingToast = toast.loading('Getting your location...');

      navigator.geolocation.getCurrentPosition(

        (position) => {

          const { latitude, longitude } = position.coords;

          

          setFormData((prev) => ({

            ...prev,

            [`${type}Location`]: {

              ...prev[`${type}Location`],

              coordinates: [longitude.toString(), latitude.toString()],

            },

          }));

          

          // Show the map with current location

          if (type === 'pickup') {

            setShowPickupMap(true);

          } else {

            setShowDropoffMap(true);

          }

          

          // Try to get the address using reverse geocoding

          fetchAddressFromCoordinates(latitude, longitude, type);

          

          toast.dismiss(loadingToast);

          toast.success(`${type === 'pickup' ? 'Pickup' : 'Dropoff'} location set to your current location`);

        },

        (error) => {

          console.error('Error getting location:', error);

          toast.dismiss(loadingToast);

          toast.error('Could not get your location. Please select it on the map.');

        },

        { enableHighAccuracy: true }

      );

    } else {

      toast.error('Geolocation is not supported by your browser');

    }

  };

  

  // Helper function to get address from coordinates

  const fetchAddressFromCoordinates = async (lat, lng, type) => {

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) return;

    

    try {

      const response = await fetch(

        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

      );

      

      const data = await response.json();

      

      if (data.status === 'OK' && data.results && data.results.length > 0) {

        const address = data.results[0].formatted_address;

        

        setFormData(prev => ({

          ...prev,

          [`${type}Location`]: {

            ...prev[`${type}Location`],

            address: address

          }

        }));

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

  

  // Handle location selection from map

  const handleLocationSelect = (location, type) => {

    if (type === 'pickup') {

      setFormData(prev => ({

        ...prev,

        pickupLocation: {

          ...prev.pickupLocation,

          coordinates: [location.lng.toString(), location.lat.toString()],

          address: location.address || ''

        }

      }));

    } else if (type === 'dropoff') {

      setFormData(prev => ({

        ...prev,

        dropoffLocation: {

          ...prev.dropoffLocation,

          coordinates: [location.lng.toString(), location.lat.toString()],

          address: location.address || ''

        }

      }));

    }

  };



  return (

    <div className="min-h-screen bg-background py-4 md:py-8 px-3 sm:px-6 lg:px-8">

      <div className="max-w-6xl mx-auto -mt-4 md:mt-0">

        <div className="card shadow-sm">

          <div className="text-center mb-4 md:mb-6">

            <h2 className="text-3xl font-bold text-gray-900">Create a New Ride</h2>

            <p className="mt-2 text-gray-600">Share your journey with others</p>

          </div>



          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Vehicle Information */}

            <div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>

                  <label className="block text-sm font-medium text-gray-700">Car Model</label>

                  <input

                    type="text"

                    name="carModel"

                    required

                    className="input mt-1"

                    placeholder="e.g. Toyota Camry"

                    value={formData.carModel}

                    onChange={handleChange}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700">Car Number</label>

                  <input

                    type="text"

                    name="carNumber"

                    required

                    className="input mt-1"

                    placeholder="e.g. ABC 123"

                    value={formData.carNumber}

                    onChange={handleChange}

                  />

                </div>

              </div>

            </div>



            {/* Location Information */}

            <div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Details</h3>

              <div className="space-y-6">

                <div>

                  <div className="mb-2">

                    <div>

                      <label className="block text-sm font-medium text-gray-700">Pickup Location</label>

                      <p className="text-xs text-gray-500 mt-0.5">Where will you start your journey?</p>

                    </div>

                  </div>

                  

                  {/* Google Maps location search */}

                  <div className="mb-4">

                    <LocationSearchBox 

                      onPlaceSelect={handleLocationSelect}

                      placeholder="Search for pickup location"

                      type="pickup"

                    />

                  </div>

                  

                  <div className="flex space-x-2 mb-4">

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

                  

                  {showPickupMap && (

                    <div className={`${isMobile ? 'absolute inset-0 z-50' : 'mb-4'}`}>

                      <GoogleMapPicker

                        initialPosition={

                          formData.pickupLocation.coordinates[1] && formData.pickupLocation.coordinates[0]

                            ? {

                                lat: parseFloat(formData.pickupLocation.coordinates[1]),

                                lng: parseFloat(formData.pickupLocation.coordinates[0])

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

                  

                  {formData.pickupLocation.address && (

                    <div className="mt-2 p-3 bg-gray-50 rounded-md">

                      <p className="text-sm font-medium text-gray-700">

                        Selected Address: {formData.pickupLocation.address}

                      </p>

                      {formData.pickupLocation.coordinates[0] && formData.pickupLocation.coordinates[1] && (

                        <p className="text-xs text-gray-500 mt-1">

                          Coordinates: [{formData.pickupLocation.coordinates[0]}, {formData.pickupLocation.coordinates[1]}]

                        </p>

                      )}

                    </div>

                  )}

                  

                  {!formData.pickupLocation.address && formData.pickupLocation.coordinates[0] && formData.pickupLocation.coordinates[1] && (

                    <div className="mt-2 p-3 bg-gray-50 rounded-md">

                      <p className="text-sm font-medium text-gray-700">

                        Location selected on map

                      </p>

                      <p className="text-xs text-gray-500 mt-1">

                        Coordinates: [{formData.pickupLocation.coordinates[0]}, {formData.pickupLocation.coordinates[1]}]

                      </p>

                    </div>

                  )}

                </div>



                <div>

                  <div className="mb-2">

                    <div>

                      <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>

                      <p className="text-xs text-gray-500 mt-0.5">Where will your journey end?</p>

                    </div>

                  </div>

                  

                  {/* Google Maps location search */}

                  <div className="mb-4">

                    <LocationSearchBox 

                      onPlaceSelect={handleLocationSelect}

                      placeholder="Search for dropoff location"

                      type="dropoff"

                    />

                  </div>

                  

                  <div className="flex space-x-2 mb-4">

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

                  

                  {showDropoffMap && (

                    <div className={`${isMobile ? 'absolute inset-0 z-50' : 'mb-4'}`}>

                      <GoogleMapPicker

                        initialPosition={

                          formData.dropoffLocation.coordinates[1] && formData.dropoffLocation.coordinates[0]

                            ? {

                                lat: parseFloat(formData.dropoffLocation.coordinates[1]),

                                lng: parseFloat(formData.dropoffLocation.coordinates[0])

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

                  

                  {formData.dropoffLocation.address && (

                    <div className="mt-2 p-3 bg-gray-50 rounded-md">

                      <p className="text-sm font-medium text-gray-700">

                        Selected Address: {formData.dropoffLocation.address}

                      </p>

                      {formData.dropoffLocation.coordinates[0] && formData.dropoffLocation.coordinates[1] && (

                        <p className="text-xs text-gray-500 mt-1">

                          Coordinates: [{formData.dropoffLocation.coordinates[0]}, {formData.dropoffLocation.coordinates[1]}]

                        </p>

                      )}

                    </div>

                  )}

                  

                  {!formData.dropoffLocation.address && formData.dropoffLocation.coordinates[0] && formData.dropoffLocation.coordinates[1] && (

                    <div className="mt-2 p-3 bg-gray-50 rounded-md">

                      <p className="text-sm font-medium text-gray-700">

                        Location selected on map

                      </p>

                      <p className="text-xs text-gray-500 mt-1">

                        Coordinates: [{formData.dropoffLocation.coordinates[0]}, {formData.dropoffLocation.coordinates[1]}]

                      </p>

                    </div>

                  )}

                </div>

              </div>

            </div>



            {/* Ride Details */}

            <div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ride Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>

                  <label className="block text-sm font-medium text-gray-700">Departure Time</label>

                  <input

                    type="datetime-local"

                    name="time"

                    required

                    className="input mt-1"

                    value={formData.time}

                    onChange={handleChange}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700">Available Seats</label>

                  <input

                    type="number"

                    name="seatsAvailable"

                    required

                    min="1"

                    className="input mt-1"

                    placeholder="e.g. 3"

                    value={formData.seatsAvailable}

                    onChange={handleChange}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700">Price per Seat</label>

                  <div className="relative mt-1">

                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                      <span className="text-gray-500 sm:text-sm">$</span>

                    </div>

                    <input

                      type="number"

                      name="price"

                      required

                      min="0"

                      step="0.01"

                      className="input pl-7"

                      placeholder="0.00"

                      value={formData.price}

                      onChange={handleChange}

                    />

                  </div>

                </div>

              </div>

            </div>



            {/* Preferences */}

            <div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ride Preferences</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">

                  <label className="flex items-center space-x-3">

                    <input

                      type="checkbox"

                      name="smokingAllowed"

                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"

                      checked={formData.smokingAllowed}

                      onChange={handleChange}

                    />

                    <span className="text-gray-700">Smoking allowed</span>

                  </label>

                  <label className="flex items-center space-x-3">

                    <input

                      type="checkbox"

                      name="petsAllowed"

                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"

                      checked={formData.petsAllowed}

                      onChange={handleChange}

                    />

                    <span className="text-gray-700">Pets allowed</span>

                  </label>

                  <label className="flex items-center space-x-3">

                    <input

                      type="checkbox"

                      name="alcoholAllowed"

                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"

                      checked={formData.alcoholAllowed}

                      onChange={handleChange}

                    />

                    <span className="text-gray-700">Alcohol allowed</span>

                  </label>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700">Gender Preference</label>

                  <select

                    name="genderPreference"

                    className="input mt-1"

                    value={formData.genderPreference}

                    onChange={handleChange}

                  >

                    <option value="any">Any</option>

                    <option value="male">Male only</option>

                    <option value="female">Female only</option>

                  </select>

                </div>

              </div>

            </div>



            <div className="pt-4">

              <button

                type="submit"

                disabled={loading}

                className="btn btn-primary w-full py-3 text-lg font-medium"

              >

                {loading ? 'Creating ride...' : 'Create Ride'}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  );

} 
