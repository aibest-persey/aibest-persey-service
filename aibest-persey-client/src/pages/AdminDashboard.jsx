import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.js"
import { listUsers, setUserRole } from "../services/adminService.js"
import { ArrowLeft, Shield, User } from "lucide-react"
import PhoneFrame from "../components/PhoneFrame.jsx"
import "./AdminDashboard.css"

const ROLE_LABELS = { student: "Student", organiser: "Organiser", admin: "Admin" }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [feedback, setFeedback] = useState({ id: null, msg: "", type: "" })

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listUsers(token)
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleSetRole = async (userId, role) => {
    setActionLoadingId(userId)
    setFeedback({ id: null, msg: "", type: "" })
    try {
      const res = await setUserRole(token, userId, role)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
      setFeedback({ id: userId, msg: res.message, type: "success" })
    } catch (err) {
      setFeedback({ id: userId, msg: err.message, type: "error" })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <PhoneFrame>
      <div className="adm-container">
        <header className="adm-header">
          <button className="adm-back-btn" onClick={() => navigate("/home")}>
            <ArrowLeft size={20} />
          </button>
          <div className="adm-header-title">
            <Shield size={18} />
            <h1>Admin Panel</h1>
          </div>
          <div style={{ width: 36 }} />
        </header>

        <div className="adm-body">
          <p className="adm-subtitle">Manage user roles — promote students to organisers or revoke organiser access.</p>

          {error && <div className="adm-banner adm-banner--error">{error}</div>}

          {loading ? (
            <div className="adm-loading">
              <div className="adm-spinner" />
            </div>
          ) : (
            <div className="adm-user-list">
              {users.map((u) => {
                const busy = actionLoadingId === u.id
                const fb = feedback.id === u.id ? feedback : null
                return (
                  <div key={u.id} className="adm-user-card">
                    <div className="adm-user-info">
                      <div
                        className="adm-user-avatar"
                        style={{ background: u.color || "#5669ff" }}
                      >
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="adm-user-details">
                        <span className="adm-user-name">{u.username}</span>
                        <span className="adm-user-email">{u.email}</span>
                      </div>
                      <span className={`adm-role-badge adm-role-badge--${u.role}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </div>

                    {fb && (
                      <p className={`adm-feedback adm-feedback--${fb.type}`}>{fb.msg}</p>
                    )}

                    {u.role !== "admin" && (
                      <div className="adm-actions">
                        {u.role === "student" ? (
                          <button
                            className="adm-action-btn adm-action-btn--promote"
                            onClick={() => handleSetRole(u.id, "organiser")}
                            disabled={busy}
                          >
                            {busy ? "..." : "Make Organiser"}
                          </button>
                        ) : (
                          <button
                            className="adm-action-btn adm-action-btn--demote"
                            onClick={() => handleSetRole(u.id, "student")}
                            disabled={busy}
                          >
                            {busy ? "..." : "Revoke Organiser"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  )
}
