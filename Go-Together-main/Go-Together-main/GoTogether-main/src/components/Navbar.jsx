import { Fragment, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, BellIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { notifications as notificationsApi } from '../services/api';
import { toast } from 'react-hot-toast';

// Updated navigation items
const publicNavigation = [];

const privateNavigation = [
  { name: 'Find Rides', href: '/rides' },
  { name: 'Offer Ride', href: '/rides/create' },
  { name: 'My Rides', href: '/my-rides' },
  { name: 'My Requests', href: '/ride-requests' },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  // Track which mobile menu is currently open
  const [openMobileMenu, setOpenMobileMenu] = useState(null);
  
  // Refs for the mobile menu buttons
  const notificationButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigationButtonRef = useRef(null);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationsApi.getNotifications({ limit: 5 });
      
      if (response.data && response.data.data) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Function to mark a notification as read
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
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get navigation items based on authentication status
  const getNavItems = () => {
    return isAuthenticated ? privateNavigation : publicNavigation;
  };

  // Function to handle mobile menu button clicks
  const handleMobileMenuClick = (menuName) => {
    // If clicking the already open menu, let the Menu component handle closing it
    // Otherwise, set this as the open menu (which will close others via useEffect)
    if (openMobileMenu !== menuName) {
      setOpenMobileMenu(menuName);
    }
  };

  // Close any open mobile menu when clicking elsewhere on the page
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking outside all menu buttons, close any open menu
      if (
        openMobileMenu && 
        notificationButtonRef.current && 
        !notificationButtonRef.current.contains(event.target) &&
        profileButtonRef.current && 
        !profileButtonRef.current.contains(event.target) &&
        navigationButtonRef.current && 
        !navigationButtonRef.current.contains(event.target)
      ) {
        setOpenMobileMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMobileMenu]);

  return (
    <Disclosure as="nav" className="bg-white shadow-md sticky top-0 z-50">
      {() => (
        <>
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex h-16 sm:h-16 md:h-16 justify-between items-center">
              {/* Logo section - takes left side on all screens */}
              <div className="flex items-center">
                <Link to="/" className="flex flex-shrink-0 items-center">
                  <span className="text-xl sm:text-2xl font-bold text-primary">GoTogether</span>
                </Link>
                
                {/* Navigation items - visible on sm+ but positioned differently on lg+ */}
                <div className="hidden sm:ml-4 md:ml-6 sm:flex sm:space-x-4 md:space-x-8 lg:hidden">
                  {getNavItems().map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-4 text-xs sm:text-sm font-medium border-b-2 ${
                        isActive(item.href)
                          ? 'border-primary text-primary lg:pb-5 lg:border-b-[3px] lg:border-b-primary lg:text-lg lg:font-semibold'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 lg:pb-3 lg:text-base'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Centered navigation for large screens only */}
              <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1">
                <div className="flex space-x-8">
                  {getNavItems().map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-4 text-base font-medium border-b-2 ${
                        isActive(item.href)
                          ? 'border-primary text-primary pb-5 border-b-[3px] border-b-primary text-lg font-semibold'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 pb-3'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-2 md:space-x-3">
                {isAuthenticated && (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-1 relative">
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 hover:text-gray-500" aria-hidden="true" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-64 sm:w-72 md:w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200 flex justify-between items-center">
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        {loadingNotifications ? (
                          <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
                        ) : (
                          <>
                            {notifications.map(notification => (
                              <Menu.Item key={notification.id}>
                                {({ active }) => (
                                  <div 
                                    className={`px-4 py-3 text-xs ${
                                      active ? 'bg-gray-100' : ''
                                    } ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium bg-gray-50'}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                  >
                                    <div className="font-medium">{notification.title}</div>
                                    <p className="text-xs text-gray-500 my-1">{notification.message}</p>
                                    <div className="text-xs text-gray-400">
                                      {new Date(notification.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                              </Menu.Item>
                            ))}
                            <div className="px-4 py-2.5 text-xs text-center border-t border-gray-100 bg-gray-50 rounded-b-md">
                              <Link 
                                to="/notifications" 
                                className="text-primary hover:text-primary/80 font-medium"
                              >
                                See all notifications
                              </Link>
                            </div>
                          </>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
                
                {isAuthenticated ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-white flex items-center justify-center">
                        {user.firstName?.[0] || user.name?.[0] || 'U'}
                      </div>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="border-b border-gray-100 pb-2">
                          <div className="px-4 py-2 text-xs font-medium text-gray-500">
                            Signed in as
                          </div>
                          <div className="px-4 py-1 font-medium text-sm text-gray-900 truncate">
                            {user.email}
                          </div>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`block px-4 py-2.5 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              Profile Settings
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/reports"
                              className={`block px-4 py-2.5 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              My Reports
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`block w-full px-4 py-2.5 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-red-600 font-medium border-t border-gray-100 mt-1 bg-gray-50 rounded-b-md`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <Link
                      to="/login"
                      className="text-gray-500 hover:text-gray-700 px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-white hover:bg-primary/90 px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 sm:hidden">
                {isAuthenticated && (
                  <>
                    {/* Notifications Icon */}
                    <Menu as="div" className="relative">
                      {({ open }) => (
                        <>
                          <Menu.Button 
                            ref={notificationButtonRef}
                            className={`flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-2 relative bg-gray-50 border border-gray-200 ${open && openMobileMenu === 'notifications' ? 'bg-gray-100 ring-2' : ''}`}
                            onClick={() => handleMobileMenuClick('notifications')}
                          >
                            <span className="sr-only">View notifications</span>
                            <BellIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                            {unreadCount > 0 && (
                              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-medium border border-white">
                                {unreadCount}
                              </span>
                            )}
                          </Menu.Button>
                          <Transition
                            show={open && openMobileMenu === 'notifications'}
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-[-30px] sm:right-0 z-10 mt-2 w-64 sm:w-72 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="px-4 py-2.5 text-sm font-medium text-gray-700 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-md">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                  <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium"
                                  >
                                    Mark all as read
                                  </button>
                                )}
                              </div>
                              {loadingNotifications ? (
                                <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
                              ) : notifications.length === 0 ? (
                                <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
                              ) : (
                                <>
                                  {notifications.map(notification => (
                                    <Menu.Item key={notification.id}>
                                      {({ active }) => (
                                        <div 
                                          className={`px-4 py-3 text-xs ${
                                            active ? 'bg-gray-100' : ''
                                          } ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium bg-gray-50'}`}
                                          onClick={() => !notification.read && markAsRead(notification.id)}
                                        >
                                          <div className="font-medium">{notification.title}</div>
                                          <p className="text-xs text-gray-500 my-1">{notification.message}</p>
                                          <div className="text-xs text-gray-400">
                                            {new Date(notification.createdAt).toLocaleString()}
                                          </div>
                                        </div>
                                      )}
                                    </Menu.Item>
                                  ))}
                                  <div className="px-4 py-2.5 text-xs text-center border-t border-gray-100 bg-gray-50 rounded-b-md">
                                    <Link 
                                      to="/notifications" 
                                      className="text-primary hover:text-primary/80 font-medium"
                                    >
                                      See all notifications
                                    </Link>
                                  </div>
                                </>
                              )}
                            </Menu.Items>
                          </Transition>
                        </>
                      )}
                    </Menu>

                    {/* Profile Icon - using same style as desktop */}
                    <Menu as="div" className="relative">
                      {({ open }) => (
                        <>
                          <Menu.Button 
                            ref={profileButtonRef}
                            className={`flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${open && openMobileMenu === 'profile' ? 'ring-2' : ''}`}
                            onClick={() => handleMobileMenuClick('profile')}
                          >
                            <span className="sr-only">Open user menu</span>
                            <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm text-base font-medium">
                              {user.firstName?.[0] || user.name?.[0] || 'U'}
                            </div>
                          </Menu.Button>
                          <Transition
                            show={open && openMobileMenu === 'profile'}
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="border-b border-gray-100 pb-2">
                                <div className="px-4 py-2.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-t-md">
                                  Signed in as
                                </div>
                                <div className="px-4 py-1.5 font-medium text-sm text-gray-900 truncate">
                                  {user.email}
                                </div>
                              </div>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/profile"
                                    className={`block px-4 py-2.5 text-sm ${
                                      active ? 'bg-gray-100' : ''
                                    } text-gray-700`}
                                  >
                                    Profile Settings
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/reports"
                                    className={`block px-4 py-2.5 text-sm ${
                                      active ? 'bg-gray-100' : ''
                                    } text-gray-700`}
                                  >
                                    My Reports
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={logout}
                                    className={`block w-full px-4 py-2.5 text-sm ${
                                      active ? 'bg-gray-100' : ''
                                    } text-red-600 font-medium border-t border-gray-100 mt-1 bg-gray-50 rounded-b-md`}
                                  >
                                    Sign out
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Transition>
                        </>
                      )}
                    </Menu>
                  </>
                )}
                
                {/* Navigation Menu Icon */}
                <Menu as="div" className="relative">
                  {({ open }) => (
                    <>
                      <Menu.Button 
                        ref={navigationButtonRef}
                        className={`flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-2 relative bg-gray-50 border border-gray-200 ${open && openMobileMenu === 'navigation' ? 'bg-gray-100 ring-2' : ''}`}
                        onClick={() => handleMobileMenuClick('navigation')}
                      >
                        <span className="sr-only">Open navigation menu</span>
                        <Bars3Icon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                      </Menu.Button>
                      <Transition
                        show={open && openMobileMenu === 'navigation'}
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-4 py-2.5 text-sm font-medium text-gray-700 border-b border-gray-200 bg-gray-50 rounded-t-md">
                            Navigation
                          </div>
                          {getNavItems().map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  to={item.href}
                                  className={`block px-4 py-2.5 text-sm ${
                                    active ? 'bg-gray-100' : ''
                                  } ${isActive(item.href) ? 'text-primary font-medium' : 'text-gray-700'}`}
                                >
                                  {item.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                          {!isAuthenticated && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/login"
                                    className={`block px-4 py-2.5 text-sm ${
                                      active ? 'bg-gray-100' : ''
                                    } text-gray-700`}
                                  >
                                    Login
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/register"
                                    className={`block px-4 py-2.5 text-sm ${
                                      active ? 'bg-gray-100' : ''
                                    } text-gray-700 font-medium`}
                                  >
                                    Register
                                  </Link>
                                )}
                              </Menu.Item>
                            </>
                          )}
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
}