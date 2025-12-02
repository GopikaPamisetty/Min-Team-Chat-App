Mini Team Chat Application
This project is a mini team chat application similar to Slack. It allows users to sign up, log in, join channels, send real-time messages, and see online users. The application includes both frontend and backend implementations.

1. Project Overview
The purpose of this project is to build a real-time chat application where multiple users can interact inside channels. The application supports messaging, presence tracking, and pagination for older messages.
This project fulfills the requirements of the Full-Stack Internship Assignment.

2. Features Implemented
User Authentication
    • Users can create an account and log in.
    • JWT token-based authentication.
    • User session persists using localStorage.
    • Protected routes restrict access to logged-in users only.
Channels
    • Users can view all channels.
    • Users can create new channels.
    • Users can join and leave channels.
    • Member count is displayed for each channel.
Real-Time Messaging
    • Messages are sent and received instantly using Socket.IO.
    • Messages include sender name, text, timestamp, and channel reference.
    • Message data is stored in MongoDB.
Online/Offline User Presence
    • Tracks online users using WebSockets.
    • Shows a list of currently online users in each channel.
    • Excludes the logged-in user's own name.
Message History and Pagination
    • Loads recent messages when entering a channel.
    • Adds a "Load Older Messages" button for pagination.
    • Older messages load without overwriting the new ones.
Frontend Interface
    • Clean and functional UI using React and Tailwind CSS.
    • Users can:
        ◦ View channels
        ◦ Join a channel
        ◦ Enter chat room
        ◦ Send messages
        ◦ See live online users
        ◦ Access authentication pages easily
        
3. Tech Stack
Frontend
    • React.js
    • React Router
    • Axios
    • Tailwind CSS
    • Socket.IO client
Backend
    • Node.js
    • Express.js
    • MongoDB with Mongoose
    • Socket.IO
    • JWT for authentication
Database
    • MongoDB (Local or MongoDB Atlas)
    
4. Folder Structure
Below is the high-level structure:
project-root/
   backend/
      src/
         controllers/
         models/
         routes/
         middleware/
         server.js
   frontend/
      src/
         pages/
         components/
         App.jsx
         index.css


5. Real-Time Messaging Design
    • Socket.IO is used to manage real-time communication.
    • Each channel is treated as a Socket.IO room.
    • When a user opens a channel:
        ◦ Frontend sends joinChannel(channelId)
        ◦ Backend adds the socket to that room
    • New messages are broadcast only to users inside the same room.
    
6. Presence Tracking
    • Each user sends userOnline event after logging in.
    • Server stores online users in a Map.
    • When a user connects or disconnects, server updates the list.
    • Frontend displays all online users except the logged-in user.
    
7. Pagination Implementation
    • Messages API supports pagination using ?page=1, ?page=2, etc.
    • Each page loads 20 messages.
    • New page results are added before existing displayed messages.
    
8. How to Run Locally
Backend Setup
    1. Navigate to backend folder:
       cd backend
    2. Install dependencies:
       npm install
    3. Create .env file with:
       MONGO_URI=your_mongodb_connection
       JWT_SECRET=your_secret
    4. Start the backend:
       npm start
Frontend Setup
    1. Navigate to frontend folder:
       cd frontend
    2. Install dependencies:
       npm install
    3. Start the frontend:
       npm run dev
Application opens at:
http://localhost:5173

9. Deployment
Both frontend and backend can be deployed separately.
Some recommended platforms:
    • Frontend: Vercel
    • Backend: Render
    • Database: MongoDB Atlas
    
10. Optional Features Not Implemented
These are optional and can be added:
    • Typing indicators
    • Private channels
    • Message editing or deletion
    • Message search
    
11. Assumptions
    • Only authenticated users can send and read messages.
    • Channel messages are public to all channel members.
    • Pagination returns 20 messages per page.
    
12. Limitations
    • No file upload support.
    • No private 
    • UI is simple and minimal for assignment requirements.
    
13. Conclusion
This project successfully meets all the mandatory requirements of the assignment:
    • Authentication
    • Channels
    • Real-time messaging
    • Online presence
    • Pagination
    • Clean frontend interface
    • Fully functional full-stack application

