import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Define libraries array outside component to prevent unnecessary re-renders
const libraries = ['places'];

// Create context for Google Maps API loading state
const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null
});

/**
 * Provider component that wraps the app to manage Google Maps API loading
 */
export function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    // This prevents the "You have included the Google Maps JavaScript API multiple times" warning
    id: 'google-map-script',
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

/**
 * Custom hook to access Google Maps API loading state
 */
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
} 