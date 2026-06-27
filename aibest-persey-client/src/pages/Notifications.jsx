import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell } from "lucide-react"
import PhoneFrame from "../components/PhoneFrame.jsx"
import "./Notifications.css"

export default function Notifications() {
  const navigate = useNavigate()

  return (
    <PhoneFrame>
      <div className="notif-container">
        <header className="notif-header">
          <button className="notif-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="notif-title">Notification</h1>
          <div style={{ width: 36 }} />
        </header>

        <div className="notif-empty">
          <div className="notif-empty-icon"><Bell size={48} color="#9da2e0" /></div>
          <h3>No Notifications</h3>
          <p>You don&apos;t have any notifications yet. We&apos;ll let you know when something arrives.</p>
        </div>
      </div>
    </PhoneFrame>
  )
}
