// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import Channels from "./pages/Channels";
// import ChannelChat from "./pages/ChannelChat";
// import Navbar from "./pages//Navbar";

// import './index.css';

// function App() {
//   return (
//     <BrowserRouter>
//      <Navbar />
//       <Routes>
       
//         <Route path="/" element={<Signup />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/channels" element={<Channels />} />
//         <Route path="/channels/:id" element={<ChannelChat />} />

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;




import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Channels from "./pages/Channels";
import ChannelChat from "./pages/ChannelChat";
import Navbar from "./pages/Navbar";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="/channels"
          element={
            <ProtectedRoute>
              <Channels />
            </ProtectedRoute>
          }
        />

        <Route
          path="/channels/:id"
          element={
            <ProtectedRoute>
              <ChannelChat />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
