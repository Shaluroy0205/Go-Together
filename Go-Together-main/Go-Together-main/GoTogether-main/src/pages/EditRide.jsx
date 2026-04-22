import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function EditRide() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    departureTime: '',
    price: '',
    availableSeats: 1,
    carModel: '',
    carNumber: '',
    preferences: {
      smoking: false,
      pets: false,
      music: false,
      gender: 'any'
    },
    additionalNotes: ''
  });

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ride details
      const response = await ridesApi.getRideById(id);
      const rideData = response.data.data || response.data;
      setRide(rideData);
      
      // Check if current user is the owner of this ride
      const rideCreatorId = typeof rideData.creator === 'string' 
        ? rideData.creator 
        : (rideData.creator?.id || rideData.creator?._id);
      
      if (rideCreatorId !== user.id) {
        setError('You are not authorized to edit this ride');
        return;
      }
      
      // Populate form data with ride details
      setFormData({
        pickupLocation: 
          typeof rideData.pickupLocation === 'string' 
            ? rideData.pickupLocation 
            : rideData.pickupLocation?.coordinates?.join(',') || '',
        dropoffLocation: 
          typeof rideData.dropoffLocation === 'string' 
            ? rideData.dropoffLocation 
            : rideData.dropoffLocation?.coordinates?.join(',') || '',
        departureTime: formatDateForInput(rideData.departureTime || rideData.time) || '',
        price: rideData.price || '',
        availableSeats: rideData.availableSeats || rideData.seatsAvailable || 1,
        carModel: rideData.carModel || '',
        carNumber: rideData.carNumber || '',
        preferences: {
          smoking: rideData.preferences?.smoking || false,
          pets: rideData.preferences?.pets || false,
          music: rideData.preferences?.music || false,
          gender: rideData.preferences?.gender || 'any'
        },
        additionalNotes: rideData.additionalNotes || ''
      });
      
    } catch (error) {
      console.error('Failed to fetch ride details:', error);
      
      let errorMessage = 'Failed to load ride details.';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Ride not found.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return '';
      
      // Format as YYYY-MM-DDThh:mm
      return date.toISOString().substring(0, 16);
    } catch (e) {
      console.error('Error formatting date for input:', e);
      return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Process location data
      const rideData = {
        ...formData,
        // Convert locations to appropriate format if needed
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
      };
      
      // Update the ride
      await ridesApi.updateRide(id, rideData);
      
      toast.success('Ride updated successfully!');
      navigate('/my-rides');
    } catch (error) {
      console.error('Failed to update ride:', error);
      
      let errorMessage = 'Failed to update ride.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">Loading ride data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-2 text-red-500">{error}</p>
        <button
          onClick={() => navigate('/my-rides')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back to My Rides
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Ride</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pickup Location */}
          <div>
            <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
              Pickup Location
            </label>
            <input
              type="text"
              id="pickupLocation"
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          
          {/* Dropoff Location */}
          <div>
            <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700">
              Dropoff Location
            </label>
            <input
              type="text"
              id="dropoffLocation"
              name="dropoffLocation"
              value={formData.dropoffLocation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          
          {/* Departure Time */}
          <div>
            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700">
              Departure Time
            </label>
            <input
              type="datetime-local"
              id="departureTime"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          
          {/* Available Seats */}
          <div>
            <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700">
              Available Seats
            </label>
            <input
              type="number"
              id="availableSeats"
              name="availableSeats"
              value={formData.availableSeats}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
          
          {/* Car Model */}
          <div>
            <label htmlFor="carModel" className="block text-sm font-medium text-gray-700">
              Car Model
            </label>
            <input
              type="text"
              id="carModel"
              name="carModel"
              value={formData.carModel}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          
          {/* Car Number */}
          <div>
            <label htmlFor="carNumber" className="block text-sm font-medium text-gray-700">
              License Plate
            </label>
            <input
              type="text"
              id="carNumber"
              name="carNumber"
              value={formData.carNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          
          {/* Gender Preference */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender Preference
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.preferences.gender}
              onChange={handlePreferenceChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="any">Any gender</option>
              <option value="male">Male only</option>
              <option value="female">Female only</option>
            </select>
          </div>
        </div>
        
        {/* Preferences */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preferences</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smoking"
                name="smoking"
                checked={formData.preferences.smoking}
                onChange={handlePreferenceChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="smoking" className="ml-2 block text-sm text-gray-700">
                Smoking allowed
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pets"
                name="pets"
                checked={formData.preferences.pets}
                onChange={handlePreferenceChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="pets" className="ml-2 block text-sm text-gray-700">
                Pets allowed
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="music"
                name="music"
                checked={formData.preferences.music}
                onChange={handlePreferenceChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="music" className="ml-2 block text-sm text-gray-700">
                Music allowed
              </label>
            </div>
          </div>
        </div>
        
        {/* Additional Notes */}
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            id="additionalNotes"
            name="additionalNotes"
            rows="3"
            value={formData.additionalNotes}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/my-rides')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Ride'}
          </button>
        </div>
      </form>
    </div>
  );
} 