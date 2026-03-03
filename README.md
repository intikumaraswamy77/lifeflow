# LifeFlow - Blood Donation Platform

A life-saving, professional web-based platform for connecting patients with nearby blood donors and blood banks using modern web technologies.

## 🚀 Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Router** for navigation
- **Socket.io Client** for real-time messaging

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** with GeoJSON support for location-based queries
- **JWT** authentication with bcrypt
- **Socket.io** for real-time messaging
- **Mongoose** for database modeling

### Hosting Options
- **Frontend**: Vercel, Netlify
- **Backend**: Render, Railway, Heroku
- **Database**: MongoDB Atlas

## 🩸 Project Overview

LifeFlow is a comprehensive platform that enables patients in urgent need of blood to quickly locate and request blood from nearby donors and blood banks through real-time location services.

### User Types

1. **🧑‍⚕️ Patient/End User**
   - Search for nearby donors and blood banks
   - Send blood requests with urgency levels
   - Real-time messaging with donors/banks

2. **💉 Blood Donor**
   - Receive blood requests from patients
   - Manage donation availability
   - Track donation history

3. **🏥 Blood Bank**
   - Manage blood inventory by blood group
   - Handle patient requests
   - Real-time stock updates

## 🌟 Key Features

- **Location-Based Search**: Find nearby donors and blood banks using GPS
- **Real-Time Messaging**: Instant communication between users
- **Blood Stock Management**: Dynamic inventory tracking for blood banks
- **Secure Authentication**: JWT-based authentication with password hashing
- **Responsive Design**: Works on desktop and mobile devices
- **GeoJSON Integration**: Efficient spatial queries for location-based searches

## 📁 Project Structure

```
blood-donation-platform/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API client
│   │   └── App.jsx         # Main app component
│   └── public/             # Static assets
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your MongoDB connection string and JWT secret:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blood-donation
   mongodb+srv://admin:root@cluster0.3uwno1t.mongodb.net/blood-donation?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   pnpm run dev
   ```

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. Create a new web service
2. Connect your GitHub repository
3. Set environment variables in the dashboard
4. Deploy with build command: `npm install`
5. Start command: `npm start`

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `pnpm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy

### Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string and update backend `.env`

## 📱 Usage

### For Patients
1. Register as a patient
2. Use location detection or manual entry
3. Search for nearby donors/blood banks
4. Send blood requests with urgency levels
5. Communicate via real-time messaging

### For Donors
1. Register with blood group and location
2. Receive blood requests from patients
3. Accept/reject requests
4. Manage availability status

### For Blood Banks
1. Register with location and contact details
2. Manage blood inventory by blood group
3. Receive and handle patient requests
4. Update stock levels in real-time

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🌍 Location Services

- GPS-based location detection
- Manual coordinate entry
- GeoJSON spatial queries
- Distance calculation
- Radius-based search

## 💬 Real-Time Features

- Socket.io integration
- Instant messaging
- Typing indicators
- Message status updates
- Real-time notifications

## 🩸 Blood Management

- Support for all blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Stock tracking in packets/liters
- Urgency levels (Low, Medium, High, Critical)
- Request status tracking (Pending, Accepted, Rejected, Completed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@lifeflow.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Thanks to all blood donors who save lives daily
- MongoDB Atlas for database hosting
- Vercel and Render for deployment platforms
- The open-source community for amazing tools and libraries

---

**"Every drop counts"** - LifeFlow Team

