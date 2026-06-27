const API_BASE = import.meta.env.VITE_API_URL ?? ""

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function handle(response) {
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.message ?? "Something went wrong.")
  return json
}

export const listUsers = (token) =>
  handle(fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders(token) }))

export const setUserRole = (token, userId, role) =>
  handle(fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  }))
