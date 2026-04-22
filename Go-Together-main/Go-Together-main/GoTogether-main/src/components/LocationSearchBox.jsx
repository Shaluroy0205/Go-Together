import { useState } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';

/**
 * LocationSearchBox component for searching locations using Google Places Autocomplete
 * 
 * @param {Object} props Component props
 * @param {Function} props.onPlaceSelect Callback when a place is selected
 * @param {string} props.placeholder Placeholder text for the search input
 * @param {string} props.type Type of location ('pickup' or 'dropoff')
 */
function LocationSearchBox({ onPlaceSelect, placeholder, type }) {
  const [searchBox, setSearchBox] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const { isLoaded, loadError } = useGoogleMaps();

  const onLoad = (ref) => {
    setSearchBox(ref);
  };

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      
      if (places && places.length > 0) {
        const place = places[0];
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
          name: place.name
        };
        
        onPlaceSelect(location, type);
        setInputValue(place.formatted_address);
      }
    }
  };

  if (loadError) {
    return <div className="p-2 text-sm text-red-500">Search cannot be loaded right now</div>;
  }

  if (!isLoaded) {
    return <div className="p-2 text-sm">Loading search...</div>;
  }

  return (
    <div className="w-full">
      <StandaloneSearchBox
        onLoad={onLoad}
        onPlacesChanged={onPlacesChanged}
      >
        <input
          type="text"
          placeholder={placeholder || "Search for a location"}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </StandaloneSearchBox>
    </div>
  );
}

export default LocationSearchBox; 