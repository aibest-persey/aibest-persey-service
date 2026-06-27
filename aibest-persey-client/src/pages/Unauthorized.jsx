import { useNavigate } from "react-router-dom"
import { ShieldOff } from "lucide-react"
import PhoneFrame from "../components/PhoneFrame.jsx"
import "./Unauthorized.css"

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <PhoneFrame>
      <div className="unauth-container">
        <div className="unauth-icon"><ShieldOff size={56} color="#f0635a" /></div>
        <h1 className="unauth-title">Access Denied</h1>
        <p className="unauth-msg">You don&apos;t have permission to view this page.</p>
        <button className="unauth-btn" onClick={() => navigate("/home")}>Go Home</button>
      </div>
    </PhoneFrame>
  )
}
