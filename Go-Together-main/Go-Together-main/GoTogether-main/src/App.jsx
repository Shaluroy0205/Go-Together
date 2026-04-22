import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Rides from './pages/Rides';
import CreateRide from './pages/CreateRide';
import EditRide from './pages/EditRide';
import RideDetail from './pages/RideDetail';
import Profile from './pages/Profile';
import MyRides from './pages/MyRides';
import RideRequests from './pages/RideRequests';
import Notifications from './pages/Notifications';
import MyReports from './pages/MyReports';
import PrivateRoute from './components/PrivateRoute';
import ReactGA from "react-ga4";
import Landing from './pages/Landing';

ReactGA.initialize("G-5LY55RM5TD");
ReactGA.send("pageview");

function App() {
  return (
    <Router>
      <AuthProvider>
        <GoogleMapsProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/rides"
                  element={
                    <PrivateRoute>
                      <Rides />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/rides/:id"
                  element={
                    <PrivateRoute>
                      <RideDetail />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/rides/create"
                  element={
                    <PrivateRoute>
                      <CreateRide />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/rides/edit/:id"
                  element={
                    <PrivateRoute>
                      <EditRide />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/my-rides"
                  element={
                    <PrivateRoute>
                      <MyRides />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ride-requests"
                  element={
                    <PrivateRoute>
                      <RideRequests />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <PrivateRoute>
                      <Notifications />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <MyReports />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </GoogleMapsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
