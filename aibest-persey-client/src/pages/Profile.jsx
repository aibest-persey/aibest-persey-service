import { useNavigate } from "react-router-dom"
import { ArrowLeft, User } from "lucide-react"
import { useAuth } from "../hooks/useAuth.js"
import PhoneFrame from "../components/PhoneFrame.jsx"
import "./Profile.css"

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <PhoneFrame>
      <div className="profile-container">
        <header className="profile-header">
          <button className="profile-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="profile-title">Profile</h1>
          <div style={{ width: 36 }} />
        </header>

        <div className="profile-body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar"><User size={40} color="#9a9cae" /></div>
            <h2 className="profile-name">{user?.username || "User"}</h2>
            <span className="profile-role-badge">{user?.role || "student"}</span>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-row">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-value">{user?.email || "—"}</span>
            </div>
            {user?.firstName && (
              <div className="profile-info-row">
                <span className="profile-info-label">First Name</span>
                <span className="profile-info-value">{user.firstName}</span>
              </div>
            )}
            {user?.lastName && (
              <div className="profile-info-row">
                <span className="profile-info-label">Last Name</span>
                <span className="profile-info-value">{user.lastName}</span>
              </div>
            )}
          </div>

          <button className="profile-logout-btn" onClick={() => { logout(); navigate("/sign-in", { replace: true }) }}>
            Sign Out
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
