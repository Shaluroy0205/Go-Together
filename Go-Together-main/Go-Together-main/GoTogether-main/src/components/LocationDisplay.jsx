import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';

const containerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '0.5rem'
};

/**
 * LocationDisplay component for displaying a static map with a marker
 * 
 * @param {Object} props Component props
 * @param {Object} props.position Location position {lat, lng}
 * @param {string} props.label Location label to display
 */
function LocationDisplay({ position, label }) {
  const { isLoaded, loadError } = useGoogleMaps();

  if (!position || !position.lat || !position.lng) {
    return (
      <div className="text-center text-gray-500 py-4 bg-gray-100 rounded-md">
        No location data available
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center text-red-500 py-4 bg-gray-100 rounded-md">
        Error loading map
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="text-center text-gray-500 py-4 bg-gray-100 rounded-md">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium text-gray-700">{label}</div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position}
        zoom={14}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: false,
          gestureHandling: 'cooperative'
        }}
      >
        <Marker position={position} />
      </GoogleMap>
      <div className="mt-1 text-xs text-gray-500">
        Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
    </div>
  );
}

export default LocationDisplay; 