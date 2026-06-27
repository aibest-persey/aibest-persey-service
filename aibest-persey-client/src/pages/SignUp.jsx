import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, Lock } from "lucide-react"
import { registerUser } from "../services/authService.js"
import PhoneFrame from "../components/PhoneFrame.jsx"
import TextField from "../components/TextField.jsx"
import PrimaryButton from "../components/PrimaryButton.jsx"
import OrDivider from "../components/OrDivider.jsx"
import GoogleButton from "../components/GoogleButton.jsx"
import "/auth.css"

export default function SignUp() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const update = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError("Please fill in all required fields."); return }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    try {
      await registerUser({ firstName: form.firstName, lastName: form.lastName, username: form.username, email: form.email, password: form.password })
      navigate("/sign-in")
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
        <h1 className="auth-heading">Sign up</h1>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form">
          <TextField icon={User} name="firstName" placeholder="First name" value={form.firstName} onChange={update} />
          <TextField icon={User} name="lastName" placeholder="Last name" value={form.lastName} onChange={update} />
          <TextField icon={User} name="username" placeholder="Username" value={form.username} onChange={update} />
          <TextField icon={Mail} name="email" placeholder="abc@email.com" value={form.email} onChange={update} />
          <TextField icon={Lock} type="password" name="password" placeholder="Password" value={form.password} onChange={update} />
          <TextField icon={Lock} type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={update} />

          <PrimaryButton type="submit" loading={loading}>SIGN UP</PrimaryButton>

          <OrDivider />
          <GoogleButton />
        </div>

        <p className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="auth-footer-link" onClick={() => navigate("/sign-in")}>Sign in</button>
        </p>
      </form>
    </PhoneFrame>
  )
}
