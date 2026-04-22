# GoTogether

<div align="center">
  <img src="https://github.com/vipulbeniwal01/GoTogether/blob/main/public/car.svg" alt="GoTogether Logo" width="180">
  <p><em>Plan journeys together. Travel as one.</em></p>
</div>

## 🌟 Overview

GoTogether is a modern ride-sharing web application designed to connect travelers going in the same direction. Built with React 18 and Vite, this platform offers an intuitive interface for offering and finding rides, managing bookings, and coordinating travel plans with fellow users in real-time.

> **⚠️ IMPORTANT NOTE:** The backend server for this project is not publicly available. This repository contains only the client-side code and is intended for demonstration purposes or for use with your own compatible backend implementation.

## ✨ Key Features

### 🚗 Unified Ride Sharing Experience
- **Offer Rides**: Any user can create and offer rides with detailed information about their journey
- **Find Rides**: Users can search and filter available rides based on location, time, and preferences
- **Booking Management**: Track the status of ride requests and bookings in a dedicated dashboard
- **Request System**: Seamless ride request and approval workflow between ride offerers and requesters

### 📍 Location & Mapping
- **Map Integration**: Visualize pickup and dropoff points with interactive maps powered by React Leaflet
- **Route Optimization**: Find the most efficient routes between locations
- **Location-Based Matching**: Connect users with nearby rides for optimal convenience

### 👥 User Profiles & Management
- **Unified User Experience**: All users can both offer and request rides with the same account
- **Profile Management**: Update personal information, preferences, and vehicle details
- **Booking History**: View past, current, and upcoming rides in one place
- **Reviews & Ratings**: Build trust with user ratings and reviews

### 🔔 Notifications & Communication
- **Status Updates**: Real-time notifications for ride request approvals, rejections, and changes
- **In-App Alerts**: Toast notifications for important events and actions
- **Email Confirmations**: Receive booking confirmations and updates via email

### 📱 Responsive Experience
- **Mobile-First Design**: Seamless experience across all devices
- **Offline Support**: Access critical ride information even without an internet connection
- **Intuitive Interface**: Clean, modern UI built with TailwindCSS and HeadlessUI components

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Development

```bash
# Clone the repository
git clone https://github.com/vipulbeniwal01/GoTogether.git
cd GoTogether


# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173` to see the application running.

## 🔧 Configuration

Copy the `.env.example` file to `.env` and adjust the variables as needed:

```bash
cp .env.example .env
```

## 📱 Deployment to Vercel

This project is configured for seamless deployment on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to Vercel (https://vercel.com)
3. Click "New Project" and import your repository
4. Select the "Vite" framework preset (should be auto-detected)
5. Configure any environment variables in the Vercel dashboard
6. Click "Deploy"

Vercel will automatically build and deploy your application whenever you push changes to your repository.

### Manual Deployment

You can also deploy using the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 📲 Feature Highlights

### My Rides
The My Rides page provides a comprehensive overview of all your ride activities:

- **Offered Rides**: Manage rides you've created, including passenger requests and ride details
- **Requested Rides**: View all rides you've requested with status indicators (pending, confirmed, rejected)
- **Rich Information**: See pickup/dropoff locations, departure times, and user details
- **Status Tracking**: Visual indicators show the current status of each booking

### Create & Manage Rides
Easily create and manage ride offerings:

- **Ride Creation**: Set up new rides with pickup/dropoff locations, time, available seats, and price
- **Preferences Setting**: Specify preferences like smoking, pets, alcohol policies, and gender preferences
- **Request Management**: Review and respond to ride requests from other users
- **Capacity Tracking**: Monitor available seats and bookings

### Find Rides
Powerful search capabilities for finding the perfect ride:

- **Ride Search**: Find available rides based on location, date, and preferences
- **Map Visualization**: See pickup and dropoff locations on interactive maps
- **Filtering Options**: Filter rides by price, available seats, and user preferences
- **User Information**: View profiles, ratings, and vehicle information of ride offerers

## 🧰 Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS for responsive design
- **State Management**: React Context API and SWR for data fetching
- **Routing**: React Router v6
- **UI Components**: HeadlessUI and HeroIcons
- **Maps**: Google Maps API for interactive mapping and location services
- **Notifications**: React Hot Toast
- **Database**: MongoDB for data storage and management

## 📋 Project Structure

```
src/
├── assets/        # Static assets and images
├── components/    # Reusable React components
├── contexts/      # React context providers
├── pages/         # Main application pages
├── services/      # API service integrations
└── styles/        # Global styles and Tailwind utilities
```

## 👥 Core Team

- **Vipul Beniwal** - _Project Lead & Full Stack Developer_
  - GitHub: [@vipulbeniwal01](https://github.com/vipulbeniwal01)
  - LinkedIn: [Vipul Beniwal](https://www.linkedin.com/in/vipulbeniwal01)
  - Email: vipulbeniwal01@gmail.com

- **Sandeep Singh** - _Project Lead & Full Stack Developer_
  - GitHub: [@Sandeepkasana](https://github.com/Sandeepkasana)
  - LinkedIn: [Sandeep Singh](https://www.linkedin.com/in/sandeep-singh26)
  - Email: sdkasana26@gmail.com
  - 
- **Mohit Chaudhary** - _Frontend Lead Developer_
  - GitHub: [@m0hitchaudhary](https://github.com/m0hitchaudhary)
  - LinkedIn: [Mohit Chaudhary](https://www.linkedin.com/in/m0hitchaudhary)
  - Email: 11chaudharymohit@gmail.com

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to fork this repository and submit a Pull Request for further enhancements. Some areas for potential improvement include:

- Adding real-time chat functionality between users
- Implementing a payment gateway for in-app payments
- Enhancing the map functionality with more detailed route information
- Adding support for recurring rides
- Implementing a mobile app version using React Native

If you have any questions or suggestions, please open an issue or reach out to the project maintainers.
