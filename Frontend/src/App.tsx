import { Route, Routes, useNavigate } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import { Toaster } from 'sonner';
import { ProtectedRoute } from "./components/ProtectedRoute"
import { GuestRoute } from "./components/GuesRoute"
import Profile from "./pages/Profile"
import { setNavigate } from "./lib/navigation"
import CreateEvent from "./pages/CreateEvent"
import EventSubmit from "./pages/EventSubmit"
import MyEvents from "./pages/MyEvents"
import EventEdit from "./pages/EventEdit"
import FinalizedEventView from "./pages/FinalizedEventView"
import ErrorBoundary from "./components/ErrorBoundary"
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback"


function App() {
  const navigate = useNavigate();
  setNavigate(navigate);
  return (
   <ErrorBoundary>
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

        <Route 
        path="/event/create" 
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        } 
      />

        <Route 
        path="/event/submit/:eventUUID" 
        element={
          <ProtectedRoute>
            <EventSubmit />
          </ProtectedRoute>
        } 
      />

        <Route 
        path="/events" 
        element={
          <ProtectedRoute>
            <MyEvents/>
          </ProtectedRoute>
        } 
      />

<Route path="/event/edit/:eventId" element={<ProtectedRoute><EventEdit /></ProtectedRoute>} />

<Route path="/event/finalized/:eventUUID" element={<ProtectedRoute><FinalizedEventView /></ProtectedRoute>} />

<Route path="/calendar-auth" element={<GoogleCalendarCallback />} />

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
  element={<VerifyEmail />}
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
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#4c1d95', // purple-950
          color: '#f5f3ff', // lighter purple, almost white for better contrast
          border: '1px solid #6b21a8', // purple-800
          fontSize: '0.95rem',
          fontWeight: '500'
        },
        className: 'custom-toast',
      }}
    />
    </ErrorBoundary>
  );
}

export default App