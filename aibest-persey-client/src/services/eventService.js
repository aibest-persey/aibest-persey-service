const API_BASE = import.meta.env.VITE_API_URL ?? ""

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}

async function handle(response) {
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.message ?? "Something went wrong.")
  return json
}

export const listEvents = (token, params = {}) => {
  const q = new URLSearchParams()
  if (params.upcoming) q.set("upcoming", "true")
  if (params.status) q.set("status", params.status)
  const qs = q.toString() ? `?${q}` : ""
  return handle(fetch(`${API_BASE}/api/events${qs}`, { headers: authHeaders(token) }))
}

export const getEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}`, { headers: authHeaders(token) }))

export const createEvent = (token, data) =>
  handle(fetch(`${API_BASE}/api/events`, { method:"POST", headers:authHeaders(token), body:JSON.stringify(data) }))

export const updateEvent = (token, id, data) =>
  handle(fetch(`${API_BASE}/api/events/${id}`, { method:"PUT", headers:authHeaders(token), body:JSON.stringify(data) }))

export const publishEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/publish`, { method:"PATCH", headers:authHeaders(token) }))

export const unpublishEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/unpublish`, { method:"PATCH", headers:authHeaders(token) }))

export const cancelEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/cancel`, { method:"PATCH", headers:authHeaders(token) }))

export const deleteEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}`, { method:"DELETE", headers:authHeaders(token) }))

export const registerForEvent = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/register`, { method:"POST", headers:authHeaders(token) }))

export const cancelRegistration = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/register`, { method:"DELETE", headers:authHeaders(token) }))

export const getParticipants = (token, id) =>
  handle(fetch(`${API_BASE}/api/events/${id}/participants`, { headers: authHeaders(token) }))
