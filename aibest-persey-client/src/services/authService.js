const API_BASE = import.meta.env.VITE_API_URL ?? ""

export async function registerUser(data) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.message ?? "Something went wrong. Please try again.")
  return json
}

export async function loginUser(data) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.message ?? "Something went wrong. Please try again.")
  return json
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(json.message ?? "Failed to fetch user session.")
    error.status = response.status
    throw error
  }
  return json
}
