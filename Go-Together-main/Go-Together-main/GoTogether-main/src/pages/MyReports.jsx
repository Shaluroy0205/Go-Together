import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reports as reportsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchMyReports();
  }, [user]);
  
  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reportsApi.getMyReports();
      console.log('My reports response:', response);
      
      if (response.data && response.data.data) {
        setReports(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      let errorMessage = 'Failed to load your reports.';
      
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
  
  // Get badge class for report status
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Get badge text for report reason
  const getReasonText = (reason) => {
    switch (reason) {
      case 'inappropriate_behavior':
        return 'Inappropriate Behavior';
      case 'unsafe_driving':
        return 'Unsafe Driving';
      case 'no_show':
        return 'No Show';
      case 'harassment':
        return 'Harassment';
      case 'other':
      default:
        return 'Other';
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Reported Issues</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-primary animate-spin h-8 w-8 border-4 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
          <p className="text-gray-500">You haven't submitted any reports yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.id || report._id} className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {report.reportedUser?.firstName 
                          ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
                          : 'Reported User'}
                      </h3>
                      <div className="mt-1 flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(report.status)}`}>
                          {report.status || 'Pending'}
                        </span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{getReasonText(report.reason)}</span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {report.ride && (
                    <button
                      onClick={() => navigate(`/rides/${report.ride.id || report.ride}`)}
                      className="ml-4 px-3 py-1 text-sm text-primary border border-primary rounded-md hover:bg-primary hover:text-white"
                    >
                      View Ride
                    </button>
                  )}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-1">Description:</p>
                  <p className="whitespace-pre-line">{report.description}</p>
                </div>
                
                {report.adminResponse && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-1">Admin Response:</p>
                    <p className="text-sm text-gray-600">{report.adminResponse}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 