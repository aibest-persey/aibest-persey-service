import { Routes, Route, Navigate } from "react-router-dom"
import SignIn from "./pages/SignIn.jsx"
import SignUp from "./pages/SignUp.jsx"
import Home from "./pages/Home.jsx"
import EventDetails from "./pages/EventDetails.jsx"
import Profile from "./pages/Profile.jsx"
import Notifications from "./pages/Notifications.jsx"
import OrganiserDashboard from "./pages/OrganiserDashboard.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import Unauthorized from "./pages/Unauthorized.jsx"
import { useAuth } from "./hooks/useAuth.js"

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) return <Navigate to="/unauthorized" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/home" replace />
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", alignItems:"center", justifyContent:"center", backgroundColor:"#f8f9fc", fontFamily:"sans-serif", color:"#747688" }}>
        <div style={{ width:"32px", height:"32px", border:"3.5px solid #e2e5f1", borderTopColor:"#5669ff", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginBottom:"12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>Verifying session...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/sign-in" replace />} />
      <Route path="/sign-in" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/organiser-dashboard" element={<ProtectedRoute allowedRoles={["organiser"]}><OrganiserDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
      <Route path="*" element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/sign-in" replace />} />
    </Routes>
  )
}
