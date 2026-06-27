import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock } from "lucide-react"
import { useAuth } from "../hooks/useAuth.js"
import { loginUser } from "../services/authService.js"
import PhoneFrame from "../components/PhoneFrame.jsx"
import TextField from "../components/TextField.jsx"
import PrimaryButton from "../components/PrimaryButton.jsx"
import OrDivider from "../components/OrDivider.jsx"
import GoogleButton from "../components/GoogleButton.jsx"
import "/auth.css"

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ identifier: "", password: "" })
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const update = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.identifier || !form.password) { setError("Please fill in all fields."); return }
    setLoading(true)
    try {
      const { token, user } = await loginUser({ identifier: form.identifier, password: form.password })
      login(token, user, remember)
      navigate("/home", { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PhoneFrame>
      <form className="auth-page" onSubmit={handleSubmit} noValidate>
        <div className="auth-logo">Persey</div>
        <h1 className="auth-heading">Sign in</h1>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form">
          <TextField icon={Mail} name="identifier" placeholder="abc@email.com" value={form.identifier} onChange={update} />
          <TextField icon={Lock} type="password" name="password" placeholder="Your password" value={form.password} onChange={update} />

          <div className="auth-row">
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember Me
            </label>
            <button type="button" className="auth-link">Forgot Password?</button>
          </div>

          <PrimaryButton type="submit" loading={loading}>SIGN IN</PrimaryButton>

          <OrDivider />
          <GoogleButton />
        </div>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <button type="button" className="auth-footer-link" onClick={() => navigate("/sign-up")}>Sign up</button>
        </p>
      </form>
    </PhoneFrame>
  )
}
