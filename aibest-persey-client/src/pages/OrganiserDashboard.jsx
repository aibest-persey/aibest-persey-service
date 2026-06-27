import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.js"
import { listEvents, publishEvent, unpublishEvent, cancelEvent, deleteEvent, createEvent } from "../services/eventService.js"
import { ArrowLeft, Plus, Calendar, Users, MapPin, X } from "lucide-react"
import PhoneFrame from "../components/PhoneFrame.jsx"
import PrimaryButton from "../components/PrimaryButton.jsx"
import TextField from "../components/TextField.jsx"
import "./OrganiserDashboard.css"

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }) } catch { return iso }
}

export default function OrganiserDashboard() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [banner, setBanner] = useState({ text:"", type:"" })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title:"", description:"", location:"", date:"", maxCapacity:"" })
  const [formLoading, setFormLoading] = useState(false)
  const [formErr, setFormErr] = useState("")

  const flash = (text, type = "success") => { setBanner({ text, type }); setTimeout(() => setBanner({ text:"", type:"" }), 4000) }

  const load = () => {
    if (!token) return
    setLoading(true)
    listEvents(token).then(setEvents).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const myEvents = events.filter((e) => e.organiserId === user?.id || e.organiser?.id === user?.id || e.isOwner)

  const act = async (fn, successMsg) => {
    try { await fn(); load(); flash(successMsg) }
    catch (err) { flash(err.message, "error") }
    finally { setActingId(null) }
  }

  const handlePublish = (id) => { setActingId(id); act(() => publishEvent(token, id), "Event published!") }
  const handleUnpublish = (id) => { setActingId(id); act(() => unpublishEvent(token, id), "Event unpublished.") }
  const handleCancel = (id) => { setActingId(id); act(() => cancelEvent(token, id), "Event cancelled.") }
  const handleDelete = async (id) => {
    setActingId(id)
    try { await deleteEvent(token, id); setEvents((p) => p.filter((e) => e.id !== id)); flash("Event deleted.") }
    catch (err) { flash(err.message, "error") }
    finally { setActingId(null); setConfirmDeleteId(null) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormErr("Title is required."); return }
    if (!form.date) { setFormErr("Date & time is required."); return }
    setFormLoading(true)
    setFormErr("")
    try {
      const payload = { ...form, maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined }
      await createEvent(token, payload)
      setShowModal(false)
      setForm({ title:"", description:"", location:"", date:"", maxCapacity:"" })
      load()
      flash("Event created!")
    } catch (err) { setFormErr(err.message) }
    finally { setFormLoading(false) }
  }

  return (
    <PhoneFrame>
      <div className="org-container">
        <header className="org-header">
          <button className="org-back-btn" onClick={() => navigate("/home")}><ArrowLeft size={20} /></button>
          <h1 className="org-title">My Events</h1>
          <button className="org-add-btn" onClick={() => setShowModal(true)}><Plus size={20} /></button>
        </header>

        <div className="org-body">
          <div className="org-welcome">
            <p className="org-welcome-sub">Hello, {user?.username ?? "Organiser"} 👋</p>
            <h2 className="org-welcome-title">Manage your events</h2>
          </div>

          {banner.text && <div className={`org-banner org-banner--${banner.type}`}>{banner.text}</div>}

          {loading ? (
            <div className="org-loading-state"><div className="spinner" /><span>Loading your events…</span></div>
          ) : myEvents.length === 0 ? (
            <div className="org-empty-state">
              <div className="org-empty-icon-wrap"><Calendar size={40} color="#b2b4c7" /></div>
              <h3>No events yet</h3>
              <p>Create your first event and start gathering attendees!</p>
              <button className="org-empty-cta" onClick={() => setShowModal(true)}><Plus size={16} /><span>Create Event</span></button>
            </div>
          ) : (
            <div className="org-events-list">
              {myEvents.map((evt) => (
                <div key={evt.id} className="org-event-card">
                  <div className="org-event-card-header">
                    <button className="org-event-card-title-btn" onClick={() => navigate(`/events/${evt.id}`)}>{evt.title}</button>
                    <span className={`org-status-badge org-status-badge--${evt.status}`}>{evt.status}</span>
                  </div>
                  {evt.description && <p className="org-event-card-desc">{evt.description}</p>}
                  <div className="org-event-card-meta">
                    <div className="org-meta-item"><Calendar size={14} className="org-meta-icon" /><span>{formatDate(evt.date)}</span></div>
                    {evt.location && <div className="org-meta-item"><MapPin size={14} className="org-meta-icon" /><span>{evt.location}</span></div>}
                    <div className="org-meta-item"><Users size={14} className="org-meta-icon" /><span>{evt.registrationCount ?? 0} registered{evt.maxCapacity ? ` / ${evt.maxCapacity}` : ""}</span></div>
                  </div>
                  <div className="org-event-actions">
                    {evt.status === "draft" && (
                      <button className="org-action-btn org-action-btn--publish" disabled={actingId === evt.id} onClick={() => handlePublish(evt.id)}>Publish</button>
                    )}
                    {evt.status === "published" && (
                      <button className="org-action-btn org-action-btn--secondary" disabled={actingId === evt.id} onClick={() => handleUnpublish(evt.id)}>Unpublish</button>
                    )}
                    {evt.status !== "cancelled" && (
                      <button className="org-action-btn org-action-btn--danger" disabled={actingId === evt.id} onClick={() => handleCancel(evt.id)}>Cancel</button>
                    )}
                    {confirmDeleteId === evt.id ? (
                      <div className="org-delete-confirm">
                        <span>Delete?</span>
                        <button className="org-action-btn org-action-btn--danger" disabled={actingId === evt.id} onClick={() => handleDelete(evt.id)}>Yes, delete</button>
                        <button className="org-action-btn org-action-btn--secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </div>
                    ) : (
                      <button className="org-action-btn org-action-btn--ghost" disabled={actingId === evt.id} onClick={() => setConfirmDeleteId(evt.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="org-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="org-modal-content">
              <div className="org-modal-header">
                <h2>Create Event</h2>
                <button className="org-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form className="org-modal-form" onSubmit={handleCreate}>
                <div className="org-form-field">
                  <TextField placeholder="Event title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="org-form-field">
                  <textarea className="org-textarea" placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="org-form-field">
                  <TextField placeholder="Location (optional)" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="org-form-field">
                  <div className="org-datetime-input-wrapper">
                    <Calendar size={18} className="org-datetime-icon" />
                    <input className="org-datetime-input" type="datetime-local" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>
                <div className="org-form-field">
                  <TextField placeholder="Max capacity (optional)" type="number" value={form.maxCapacity} onChange={(e) => setForm((p) => ({ ...p, maxCapacity: e.target.value }))} />
                </div>
                {formErr && <div className="org-banner org-banner--error">{formErr}</div>}
                <div className="org-form-action">
                  <PrimaryButton type="submit" loading={formLoading}>Create Event</PrimaryButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}
