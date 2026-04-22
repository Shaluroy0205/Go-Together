import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications as notificationsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 20,
    count: 0,
    unreadCount: 0
  });
  const [filter, setFilter] = useState({
    unreadOnly: false
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchNotifications();
  }, [user, pagination.currentPage, filter.unreadOnly]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsApi.getNotifications({
        page: pagination.currentPage,
        limit: pagination.limit,
        unreadOnly: filter.unreadOnly
      });
      
      console.log('Notifications response:', response);
      
      if (response.data) {
        setNotifications(response.data.data || []);
        setPagination({
          ...pagination,
          totalPages: response.data.totalPages || 1,
          count: response.data.count || 0,
          unreadCount: response.data.unreadCount || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      let errorMessage = 'Failed to load notifications.';
      
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
  
  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setPagination(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setPagination(prev => ({
        ...prev,
        unreadCount: 0
      }));
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };
  
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      currentPage: newPage
    });
  };
  
  const toggleUnreadFilter = () => {
    setFilter({
      ...filter,
      unreadOnly: !filter.unreadOnly
    });
    
    // Reset to first page when changing filter
    setPagination({
      ...pagination,
      currentPage: 1
    });
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
  
  // Get notification icon based on type
  const getNotificationIcon = (notificationType) => {
    // You can customize this based on your notification types
    return <BellIcon className="h-5 w-5 text-primary" />;
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        
        <div className="flex gap-3">
          <button
            onClick={toggleUnreadFilter}
            className={`px-3 py-1.5 text-sm border rounded-md ${
              filter.unreadOnly
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.unreadOnly ? 'Show All' : 'Show Unread Only'}
          </button>
          
          {pagination.unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-sm border rounded-md bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-primary animate-spin h-8 w-8 border-4 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-md shadow p-6 text-center">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
          <p className="text-gray-500">
            {filter.unreadOnly 
              ? "You don't have any unread notifications" 
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-800'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    
                    {/* Optional: Add action buttons based on notification type */}
                    {notification.data && notification.data.ride && (
                      <div className="mt-2">
                        <button
                          onClick={() => navigate(`/rides/${notification.data.ride.id}`)}
                          className="inline-flex text-xs text-primary hover:text-primary/80"
                        >
                          View related ride
                        </button>
                      </div>
                    )}
                    
                    {!notification.read && (
                      <div className="mt-2 flex">
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
                        >
                          <CheckIcon className="mr-1 h-4 w-4" />
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{1 + (pagination.currentPage - 1) * pagination.limit}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.count)}
                </span>{' '}
                of <span className="font-medium">{pagination.count}</span> notifications
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.currentPage === 1
                      ? 'text-gray-300'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page numbers - simplified version */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === pagination.currentPage
                        ? 'z-10 bg-primary border-primary text-white'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.currentPage === pagination.totalPages
                      ? 'text-gray-300'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
} 