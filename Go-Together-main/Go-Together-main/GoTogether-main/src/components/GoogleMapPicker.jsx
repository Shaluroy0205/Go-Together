import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

// Mobile specific styles that will override the default styles
const mobileContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 50
};

const defaultCenter = {
  lat: 37.7749, // San Francisco as default
  lng: -122.4194
};

/**
 * GoogleMapPicker component for selecting locations on Google Maps
 * 
 * @param {Object} props Component props
 * @param {Object} props.initialPosition Initial map position {lat, lng}
 * @param {Function} props.onLocationSelect Callback when location is selected
 * @param {string} props.type Type of location picker ('pickup' or 'dropoff')
 * @param {Function} props.onClose Optional callback when map is closed (mobile only)
 * @param {boolean} props.isMobile Whether the component is rendered on a mobile device
 */
function GoogleMapPicker({ initialPosition, onLocationSelect, type, onClose, isMobile = false }) {
  const [position, setPosition] = useState(initialPosition || defaultCenter);
  const [map, setMap] = useState(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  
  // Try to get user's current location on component mount if no initialPosition is provided
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setPosition(currentPosition);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to default if geolocation fails
          setPosition(defaultCenter);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [initialPosition]);
  
  // Update position when initialPosition changes
  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  // Add visibility animation effect
  useEffect(() => {
    // Delay setting visible to allow CSS transitions to work
    const timer = setTimeout(() => {
      setIsMapVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  const onLoad = useCallback((map) => {
    setMap(map);
    mapRef.current = map;
  }, []);
  
  const onUnmount = useCallback(() => {
    setMap(null);
    mapRef.current = null;
  }, []);
  
  const handleMapClick = (event) => {
    const newPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setPosition(newPosition);
    
    if (onLocationSelect) {
      onLocationSelect(newPosition, type);
    }
  };

  const handleClose = () => {
    setIsMapVisible(false);
    
    // Immediately restore scrolling in case it was disabled
    if (isMobile) {
      document.body.style.overflow = '';
    }
    
    // Give time for animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300); // match this with your CSS transition duration
  };
  
  if (loadError) {
    return <div className="p-4 text-center text-red-500">Map cannot be loaded right now, sorry.</div>
  }
  
  if (!isLoaded) {
    return <div className="p-4 text-center">Loading maps...</div>
  }

  const currentContainerStyle = isMobile ? mobileContainerStyle : containerStyle;
  
  return (
    <div className={`transition-opacity duration-300 ease-in-out ${isMapVisible ? 'opacity-100' : 'opacity-0'} ${isMobile ? 'fixed inset-0 bg-black bg-opacity-50 flex flex-col z-50' : ''}`}>
      {isMobile && (
        <div className="bg-white p-3 flex justify-between items-center shadow-md z-10">
          <h3 className="font-medium text-gray-800">{type === 'pickup' ? 'Set Pickup Location' : 'Set Dropoff Location'}</h3>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none" 
            onClick={handleClose}
            aria-label="Close map"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      )}
      
      <div className={`${isMobile ? 'flex-grow' : ''}`}>
        <GoogleMap
          mapContainerStyle={currentContainerStyle}
          center={position}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            fullscreenControl: !isMobile, // Disable fullscreen control on mobile
            zoomControl: true,
            streetViewControl: !isMobile,
            mapTypeControl: !isMobile,
            gestureHandling: 'greedy', // Makes one-finger movements pan instead of requiring two fingers on mobile
          }}
        >
          <Marker 
            position={position} 
            draggable={true}
            onDragEnd={(e) => {
              const newPosition = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              };
              setPosition(newPosition);
              if (onLocationSelect) {
                onLocationSelect(newPosition, type);
              }
            }}
          />
        </GoogleMap>
      </div>
      
      {isMobile && (
        <div className="bg-white p-4 shadow-inner">
          <button
            type="button"
            className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            onClick={handleClose}
          >
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
}

export default GoogleMapPicker;