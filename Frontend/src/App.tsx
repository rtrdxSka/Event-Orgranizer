import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"

import { ProtectedRoute } from "./components/ProtectedRoute"
import { GuestRoute } from "./components/GuesRoute"
import Profile from "./pages/Profile"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      {/* Protected Routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Guest Routes */}
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } 
      />
      <Route 
        path="/email/verify/:code" 
        element={
          <GuestRoute>
            <VerifyEmail />
          </GuestRoute>
        } 
      />
      <Route 
        path="/password/forgot" 
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        } 
      />
      <Route 
        path="/password/reset" 
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        } 
      />
    </Routes>
  );
}

export default App