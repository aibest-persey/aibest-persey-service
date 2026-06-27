import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.js"
import { listEvents } from "../services/eventService.js"
import { ChevronDown, Bell, Search, SlidersHorizontal, Music, Utensils, Palette, MapPin, Bookmark, User, MessageSquare, Calendar, Mail, LogOut, Shield } from "lucide-react"
import PhoneFrame from "../components/PhoneFrame.jsx"
import "./Home.css"

function SportsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M6.2 6.2a8.8 8.8 0 0 0 0 11.6" /><path d="M17.8 6.2a8.8 8.8 0 0 1 0 11.6" /><path d="M2 12h20" /><path d="M12 2v20" />
    </svg>
  )
}

const GRADIENTS = ["linear-gradient(135deg,#667eea 0%,#764ba2 100%)","linear-gradient(135deg,#f093fb 0%,#f5576c 100%)","linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)","linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)","linear-gradient(135deg,#fa709a 0%,#fee140 100%)","linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)"]

function getGradient(id) {
  if (!id) return GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff
  return GRADIENTS[hash % GRADIENTS.length]
}

function formatCardDate(iso) {
  try { const d = new Date(iso); return { day: String(d.getDate()).padStart(2,"0"), month: d.toLocaleString("en-US",{month:"short"}).toUpperCase() } }
  catch { return { day:"--", month:"---" } }
}

export default function Home() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [profile] = useState(() => {
    const saved = localStorage.getItem("persey_user_profile")
    if (saved) { try { return JSON.parse(saved) } catch { /* */ } }
    return { nickname: user ? (user.username || "User") : "User", avatar: "" }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("sports")
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookmarked, setBookmarked] = useState({})

  const CATEGORIES = [
    { id:"sports", name:"Sports", icon:SportsIcon, color:"#f0635a" },
    { id:"music", name:"Music", icon:Music, color:"#f59762" },
    { id:"food", name:"Food", icon:Utensils, color:"#29d697" },
    { id:"art", name:"Art", icon:Palette, color:"#46cdfb" },
  ]

  useEffect(() => {
    if (!token) return
    setLoading(true)
    listEvents(token).then(setEvents).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const filtered = events.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q)
  })

  const trending = [...filtered].sort((a,b) => (b.registrationCount??0)-(a.registrationCount??0))
  const upcoming = [...filtered].sort((a,b) => new Date(a.date)-new Date(b.date))
  const toggleBookmark = (id) => setBookmarked((p) => ({ ...p, [id]: !p[id] }))

  const renderCard = (evt) => {
    const { day, month } = formatCardDate(evt.date)
    return (
      <div key={evt.id} className="event-card" onClick={() => navigate(`/events/${evt.id}`)} style={{ cursor:"pointer" }}>
        <div className="event-card-img-wrapper" style={{ background: getGradient(evt.id) }}>
          <div className="card-date-badge"><span className="card-date-day">{day}</span><span className="card-date-month">{month}</span></div>
          <button className="card-bookmark-btn" onClick={(e) => { e.stopPropagation(); toggleBookmark(evt.id) }} aria-label="Bookmark">
            <Bookmark size={14} className="card-bookmark-icon" style={{ fill: bookmarked[evt.id] ? "#f0635a":"none", color:"#f0635a" }} />
          </button>
        </div>
        <div className="event-card-info">
          <h3 className="event-card-title">{evt.title}</h3>
          <div className="event-card-location">
            <MapPin size={14} className="event-card-location-icon" />
            <span className="event-card-location-text">{evt.location || "Location TBA"}</span>
          </div>
        </div>
      </div>
    )
  }

  const emptyCard = <div className="event-card-empty"><p>No events found.</p></div>

  return (
    <PhoneFrame>
      <div className="home-container">
        <div className={`sidebar-overlay ${sidebarOpen ? "sidebar-overlay--visible" : ""}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar-drawer ${sidebarOpen ? "sidebar-drawer--open" : ""}`}>
          <div className="sidebar-profile">
            <div className="sidebar-avatar"><User size={32} color="#9a9cae" /></div>
            <span className="sidebar-username">{profile.nickname}</span>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-nav-item" onClick={() => { setSidebarOpen(false); navigate("/profile") }}>
              <User size={20} className="sidebar-nav-icon" /><span>My Profile</span>
            </button>
            {user?.role === "organiser" && (
              <button className="sidebar-nav-item" onClick={() => { setSidebarOpen(false); navigate("/organiser-dashboard") }}>
                <SlidersHorizontal size={20} className="sidebar-nav-icon" /><span>Organiser Dashboard</span>
              </button>
            )}
            {user?.role === "admin" && (
              <button className="sidebar-nav-item" onClick={() => { setSidebarOpen(false); navigate("/admin") }}>
                <Shield size={20} className="sidebar-nav-icon" /><span>Admin Panel</span>
              </button>
            )}
            <button className="sidebar-nav-item"><div className="sidebar-nav-icon-wrap"><MessageSquare size={20} className="sidebar-nav-icon" /><span className="sidebar-msg-badge">9</span></div><span>Message</span></button>
            <button className="sidebar-nav-item"><Calendar size={20} className="sidebar-nav-icon" /><span>Calendar</span></button>
            <button className="sidebar-nav-item"><Bookmark size={20} className="sidebar-nav-icon" /><span>Bookmark</span></button>
            <button className="sidebar-nav-item"><Mail size={20} className="sidebar-nav-icon" /><span>Contact Us</span></button>
            <button className="sidebar-nav-item sidebar-nav-item--signout" onClick={() => { logout(); navigate("/sign-in", { replace:true }) }}>
              <LogOut size={20} className="sidebar-nav-icon" /><span>Sign Out</span>
            </button>
          </nav>
        </aside>

        <header className="home-header">
          <div className="home-nav-row">
            <button className="home-menu-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="16" y2="12" /><line x1="3" y1="18" x2="10" y2="18" />
              </svg>
            </button>
            <div className="home-location-selector">
              <div className="home-location-label"><span>Current Location</span><ChevronDown size={14} /></div>
              <span className="home-location-value">Burgas, Bulgaria</span>
            </div>
            <button className="home-notification-btn" onClick={() => navigate("/notifications")}>
              <Bell size={20} /><div className="home-notification-badge" />
            </button>
          </div>
          <div className="home-search-row">
            <div className="home-search-wrapper">
              <Search size={22} className="home-search-icon" />
              <div className="home-search-divider" />
              <input className="home-search-input" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="home-filter-btn"><span className="home-filter-icon"><SlidersHorizontal size={12} /></span><span>Filters</span></button>
          </div>
        </header>

        <section className="home-interests-container">
          <div className="home-interests-scroll">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = cat.id === activeCategory
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="interest-pill" style={{ backgroundColor:cat.color, opacity:active?1:0.7, transform:active?"scale(1.03)":"scale(1)" }}>
                  <Icon size={18} /><span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {loading ? (
          <div className="home-loading">
            <div style={{ width:28, height:28, border:"3px solid #e2e5f1", borderTopColor:"#5669ff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
          </div>
        ) : (
          <>
            <section className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">Trending Events</h2>
                <button className="home-see-all-btn"><span>See All</span><span className="home-see-all-arrow">▶</span></button>
              </div>
              <div className="home-events-scroll">{trending.length > 0 ? trending.map(renderCard) : emptyCard}</div>
            </section>
            <section className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">Upcoming Near You</h2>
                <button className="home-see-all-btn"><span>See All</span><span className="home-see-all-arrow">▶</span></button>
              </div>
              <div className="home-events-scroll">{upcoming.length > 0 ? upcoming.map(renderCard) : emptyCard}</div>
            </section>
          </>
        )}
      </div>
    </PhoneFrame>
  )
}
