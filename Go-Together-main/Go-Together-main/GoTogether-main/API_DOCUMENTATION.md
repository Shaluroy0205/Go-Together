# GoTogether API Documentation

## Base URL
- Development: `http://localhost:4000`
- Production: `[Your production URL]`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Authentication APIs

#### 1.1 Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Register a new user

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

#### 1.2 Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 2. Ride Management APIs

#### 2.1 Create Ride
- **Endpoint**: `POST /api/rides/createRide`
- **Access**: Protected
- **Description**: Create a new ride offering

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "carModel": "Honda Civic",
  "carNumber": "ABC123",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]  // [longitude, latitude]
  },
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [-71.058880, 42.360082]  // [longitude, latitude]
  },
  "time": "2024-03-30T10:00:00.000Z",
  "seatsAvailable": 3,
  "price": 15.5,
  "smokingAllowed": false,
  "petsAllowed": true,
  "alcoholAllowed": false,
  "genderPreference": "any"  // "any", "male", or "female"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "creator": "user_id",
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610]
    },
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-71.058880, 42.360082]
    },
    "departureTime": "2024-03-30T10:00:00.000Z",
    "availableSeats": 3,
    "price": 15.5,
    "status": "active",
    "preferences": {
      "smoking": false,
      "pets": true,
      "alcohol": false,
      "gender": "any"
    },
    "passengers": [],
    "createdAt": "2024-02-26T04:02:34.000Z",
    "updatedAt": "2024-02-26T04:02:34.000Z"
  }
}
```

#### 2.2 Get All Rides
- **Endpoint**: `GET /api/rides/getRides`
- **Access**: Public
- **Description**: Get all available rides

**Query Parameters (optional):**
```
from: string (comma-separated coordinates)
to: string (comma-separated coordinates)
date: string (ISO date)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ride_id",
      "creator": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "status": "active",
      "preferences": {
        "smoking": false,
        "pets": true,
        "alcohol": false,
        "gender": "any"
      },
      "passengers": []
    }
  ]
}
```

#### 2.3 Get Best Matching Rides
- **Endpoint**: `GET /api/rides/bestRides`
- **Access**: Public
- **Description**: Get rides based on location proximity

**Query Parameters:**
```
pickupLat: number (latitude)
pickupLng: number (longitude)
dropoffLat: number (latitude)
dropoffLng: number (longitude)
maxDistance?: number (optional, defaults to 5000 meters, max 20000)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ride_id",
      "creator": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "pickupDistance": 100,
      "dropoffDistance": 150,
      "totalDistance": 250
    }
  ]
}
```

#### 2.4 Get User Ride Requests
- **Endpoint**: `GET /api/rides/myRequests`
- **Access**: Protected (Any authenticated user)
- **Description**: Get all rides where the user has made a request

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "ride_id",
      "creator": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5,
        "carModel": "Honda Civic",
        "carNumber": "ABC123"
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "status": "active",
      "preferences": {
        "smoking": false,
        "pets": true,
        "alcohol": false,
        "gender": "any"
      },
      "passengers": [
        {
          "user": "user_id",
          "status": "pending"
        }
      ],
      "userRequestStatus": "pending"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "No ride requests found for this user"
}
```

#### 2.5 Get Ride by ID
- **Endpoint**: `GET /api/rides/:id`
- **Access**: Public
- **Description**: Get details of a specific ride by its ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "67b0e6c10a30e235f6d10aee",
    "creator": {
      "id": "67b0e3f50a30e235f6d10ad6",
      "firstName": "Vipul",
      "lastName": "Beniwal",
      "rating": 0
    },
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-0.127758, 51.507351]
    },
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-0.076132, 51.508481]
    },
    "departureTime": "2024-03-20T08:00:00.000Z",
    "availableSeats": 1,
    "price": 15.5,
    "status": "active",
    "carModel": "tesla",
    "carNumber": "12216863",
    "preferences": {
      "smoking": false,
      "pets": true,
      "gender": "male"
    },
    "passengers": [
      {
        "user": "67b0e3f50a30e235f6d10ad6",
        "status": "confirmed"
      }
    ],
    "createdAt": "2025-02-15T19:10:57.986Z",
    "updatedAt": "2025-02-26T10:27:48.260Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ride not found"
}
```

#### 2.6 Request Ride
- **Endpoint**: `PUT /api/rides/:id/request`
- **Access**: Protected
- **Description**: Request to join a ride

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "creator": "user_id",
    "passengers": [
      {
        "user": "user_id",
        "status": "pending"
      }
    ],
    "availableSeats": 3,
    "status": "active"
  }
}
```

#### 2.7 Approve/Reject Ride Request
- **Endpoint**: `PUT /api/rides/:id/approval`
- **Access**: Protected (Ride creator only)
- **Description**: Ride creator can approve or reject ride requests

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "passengerId": "user_id",
  "status": "confirmed"  // "confirmed" or "rejected"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "creator": "user_id",
    "passengers": [
      {
        "user": "user_id",
        "status": "confirmed"
      }
    ],
    "availableSeats": 2,
    "status": "active"
  }
}
```

#### 2.8 Get User Created Rides
- **Endpoint**: `GET /api/rides/created/list`
- **Access**: Protected (Any authenticated user)
- **Description**: Get all rides created by the current user

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "ride_id",
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "status": "active",
      "carModel": "Honda Civic",
      "carNumber": "ABC123",
      "preferences": {
        "smoking": false,
        "pets": true,
        "gender": "any"
      },
      "passengers": [
        {
          "user": {
            "id": "user_id",
            "firstName": "Jane",
            "lastName": "Doe"
          },
          "status": "confirmed"
        }
      ],
      "createdAt": "2024-02-26T04:02:34.000Z"
    }
  ]
}
```

#### 2.9 Update Ride
- **Endpoint**: `PUT /api/rides/:id`
- **Access**: Protected (Ride creator only)
- **Description**: Update details of a ride

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "carModel": "Toyota Camry",
  "carNumber": "XYZ789",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  },
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [-71.058880, 42.360082]
  },
  "departureTime": "2024-04-01T12:00:00.000Z",
  "seatsAvailable": 4,
  "price": 20.0,
  "preferences": {
    "smoking": true,
    "pets": false,
    "gender": "any"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "creator": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "rating": 4.5
    },
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610]
    },
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-71.058880, 42.360082]
    },
    "departureTime": "2024-04-01T12:00:00.000Z",
    "availableSeats": 4,
    "price": 20.0,
    "status": "active",
    "carModel": "Toyota Camry",
    "carNumber": "XYZ789",
    "preferences": {
      "smoking": true,
      "pets": false,
      "gender": "any"
    },
    "passengers": []
  }
}
```

#### 2.10 Cancel Ride
- **Endpoint**: `DELETE /api/rides/:id`
- **Access**: Protected (Ride creator only)
- **Description**: Cancel a ride

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ride cancelled successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Not authorized to cancel this ride"
}
```

### 3. User Management APIs

#### 3.1 Get User Profile
- **Endpoint**: `GET /api/users/profile`
- **Access**: Protected
- **Description**: Get the current authenticated user's profile information

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "vehicle": {
      "model": "Honda Civic",
      "licensePlate": "ABC123"
    },
    "preferences": {
      "smoking": false,
      "pets": true,
      "music": true
    },
    "rating": 4.5,
    "createdAt": "2024-02-26T04:02:34.000Z"
  }
}
```

#### 3.2 Update User Profile
- **Endpoint**: `PUT /api/users/profile`
- **Access**: Protected
- **Description**: Update the current user's profile information

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "9876543210",
  "preferences": {
    "smoking": true,
    "pets": false,
    "music": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "9876543210",
    "preferences": {
      "smoking": true,
      "pets": false,
      "music": true
    },
    "rating": 4.5
  }
}
```

#### 3.3 Update Vehicle Information
- **Endpoint**: `PUT /api/users/vehicle`
- **Access**: Protected
- **Description**: Update the current user's vehicle information

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "model": "Toyota Camry",
  "licensePlate": "XYZ789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Smith",
    "vehicle": {
      "model": "Toyota Camry",
      "licensePlate": "XYZ789"
    }
  }
}
```

### 4. Rating System APIs

#### 4.1 Create Rating
- **Endpoint**: `POST /api/ratings`
- **Access**: Protected
- **Description**: Rate a user after completing a ride with them

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "rideId": "ride_id",
  "ratedUserId": "user_id_to_rate",
  "score": 5,
  "comment": "Great driver, very punctual and friendly!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rating_id",
    "ride": "ride_id",
    "rater": "current_user_id",
    "rated": "rated_user_id",
    "score": 5,
    "comment": "Great driver, very punctual and friendly!",
    "createdAt": "2024-02-27T10:30:45.000Z"
  }
}
```

#### 4.2 Get User Ratings
- **Endpoint**: `GET /api/ratings/:userId`
- **Access**: Public
- **Description**: Get all ratings for a specific user

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "averageRating": 4.5,
  "data": [
    {
      "id": "rating_id",
      "rater": {
        "id": "rater_user_id",
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "score": 5,
      "comment": "Excellent passenger, very respectful",
      "createdAt": "2024-02-27T10:30:45.000Z"
    }
  ]
}
```

### 5. Ride History & Status Management

#### 5.1 Complete a Ride
- **Endpoint**: `PUT /api/rides/:id/complete`
- **Access**: Protected (Ride creator only)
- **Description**: Mark a ride as completed

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ride marked as completed",
  "data": {
    "id": "ride_id",
    "creator": "user_id",
    "status": "completed",
    "departureTime": "2024-03-30T10:00:00.000Z"
  }
}
```

#### 5.2 Get Ride History
- **Endpoint**: `GET /api/rides/history`
- **Access**: Protected
- **Description**: Get the user's ride history (completed or cancelled rides)

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "ride_id",
      "creator": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-15T10:00:00.000Z",
      "status": "completed",
      "passengers": [
        {
          "user": {
            "id": "passenger_id",
            "firstName": "Jane",
            "lastName": "Smith",
            "rating": 4.8
          },
          "status": "confirmed"
        }
      ]
    }
  ]
}
```

### 6. User Search APIs

#### 6.1 Search Users by Name
- **Endpoint**: `GET /api/users/search`
- **Access**: Protected
- **Description**: Search for users by name

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
```
query: string (search term)
limit: number (optional, defaults to 10)
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "rating": 4.5,
      "vehicle": {
        "model": "Honda Civic",
        "licensePlate": "ABC123"
      },
      "createdAt": "2024-02-15T19:10:57.986Z"
    }
  ]
}
```

#### 6.2 Get User Public Profile
- **Endpoint**: `GET /api/users/:id`
- **Access**: Public
- **Description**: Get a user's public profile information

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "rating": 4.5,
    "vehicle": {
      "model": "Honda Civic",
      "licensePlate": "ABC123"
    },
    "preferences": {
      "smoking": false,
      "pets": true,
      "music": true
    },
    "createdAt": "2024-02-15T19:10:57.986Z"
  }
}
```

### 7. User Safety & Reporting System

#### 7.1 Report a User
- **Endpoint**: `POST /api/reports`
- **Access**: Protected
- **Description**: Submit a report about another user

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "reportedUserId": "user_id_to_report",
  "rideId": "ride_id",
  "reason": "inappropriate_behavior",
  "description": "Detailed description of the issue"
}
```

**Available Reasons:**
- `inappropriate_behavior`
- `unsafe_driving`
- `no_show`
- `harassment`
- `other`

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "report_id",
    "reporter": "current_user_id",
    "reportedUser": "reported_user_id",
    "ride": "ride_id",
    "reason": "inappropriate_behavior",
    "description": "Detailed description of the issue",
    "status": "pending",
    "createdAt": "2024-03-01T14:30:45.000Z"
  }
}
```

#### 7.2 View My Reports
- **Endpoint**: `GET /api/reports/my-reports`
- **Access**: Protected
- **Description**: Get a list of reports submitted by the current user

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "report_id",
      "reportedUser": {
        "id": "user_id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "ride": {
        "departureTime": "2024-03-15T10:00:00.000Z",
        "pickupLocation": {
          "type": "Point",
          "coordinates": [-73.935242, 40.730610]
        },
        "dropoffLocation": {
          "type": "Point", 
          "coordinates": [-71.058880, 42.360082]
        }
      },
      "reason": "inappropriate_behavior",
      "description": "Detailed description of the issue",
      "status": "pending",
      "createdAt": "2024-03-01T14:30:45.000Z"
    }
  ]
}
```

### 8. Notification System

#### 8.1 Get User Notifications
- **Endpoint**: `GET /api/notifications`
- **Access**: Protected
- **Description**: Get the current user's notifications with pagination

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
```
page: number (optional, defaults to 1)
limit: number (optional, defaults to 20)
unreadOnly: boolean (optional, defaults to false)
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 25,
  "unreadCount": 5,
  "totalPages": 2,
  "currentPage": 1,
  "data": [
    {
      "id": "notification_id",
      "type": "ride_request",
      "title": "New Ride Request",
      "message": "John Doe has requested to join your ride",
      "data": {
        "ride": {
          "id": "ride_id",
          "departureTime": "2024-03-30T10:00:00.000Z",
          "status": "active"
        },
        "user": {
          "id": "user_id",
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "read": false,
      "createdAt": "2024-03-01T14:30:45.000Z"
    }
  ]
}
```

#### 8.2 Mark a Notification as Read
- **Endpoint**: `PUT /api/notifications/:id/read`
- **Access**: Protected
- **Description**: Mark a specific notification as read

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "notification_id",
    "read": true
  }
}
```

#### 8.3 Mark All Notifications as Read
- **Endpoint**: `PUT /api/notifications/mark-all-read`
- **Access**: Protected
- **Description**: Mark all notifications for the current user as read

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## Error Responses

### Common Error Formats

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation error details"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Notes

1. All timestamps are in ISO 8601 format
2. Coordinates are in [longitude, latitude] format for GeoJSON compatibility
3. Distance values in the Best Rides API are in meters
4. The maxDistance parameter in Best Rides API is capped at 20km (20000 meters)
5. Ride status can be: "active", "completed", "cancelled", or "busy"
6. Passenger request status can be: "pending", "confirmed", or "rejected" 