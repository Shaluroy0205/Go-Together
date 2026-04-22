import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  IdentificationIcon, 
  StarIcon, 
  MapIcon,
  CalendarIcon,
  CogIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-slate-700 to-slate-800 h-32 sm:h-40">
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-14 sm:-bottom-16">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white p-1 shadow-md">
                <div className="h-full w-full rounded-full bg-slate-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-inner">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mt-2">
                {user?.firstName} {user?.lastName}
              </h1>
              <div className="mt-1 sm:mt-2 flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  Active
                </span>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <Link 
                  to="/settings" 
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
                >
                  <CogIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-6 sm:mt-10 space-y-4 sm:space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center border-b border-gray-100 pb-2 mb-3">
                  <IdentificationIcon className="h-5 w-5 text-slate-600 mr-2" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="group p-3 sm:p-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-gray-100">
                      <div className="flex items-center">
                        <UserIcon className="h-4 sm:h-5 w-4 sm:w-5 text-slate-500 mr-2" />
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500">Full Name</h3>
                      </div>
                      <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-900 font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                    
                    <div className="group p-3 sm:p-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-gray-100">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 sm:h-5 w-4 sm:w-5 text-slate-500 mr-2" />
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500">Email Address</h3>
                      </div>
                      <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-900 font-medium truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="group p-3 sm:p-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-gray-100">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-slate-500 mr-2" />
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500">Member Since</h3>
                      </div>
                      <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-900 font-medium">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center border-b border-gray-100 pb-2 mb-3">
                  <UserGroupIcon className="h-5 w-5 text-slate-600 mr-2" />
                  Ride Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-slate-50">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                      <MapIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-slate-500 mr-1" />
                      Total Trips
                    </h3>
                    <div className="mt-2 sm:mt-3 flex items-baseline">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">0</p>
                      <p className="ml-2 text-xs sm:text-sm text-gray-500 font-normal">completed trips</p>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-slate-50">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                      <StarIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-500 mr-1" />
                      Rating
                    </h3>
                    <div className="mt-2 sm:mt-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        New User
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6">
                  <Link 
                    to="/find-rides" 
                    className="inline-flex items-center justify-center w-full px-6 py-2 sm:py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors duration-200"
                  >
                    Find Rides
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 