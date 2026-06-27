import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function TextField({ icon: Icon, type = "text", placeholder, value, onChange, name, error }) {
  const isPassword = type === "password"
  const [show, setShow] = useState(false)
  const inputType = isPassword ? (show ? "text" : "password") : type

  return (
    <div className="field-wrapper">
      <label className={`field${error ? " field--error" : ""}`}>
        {Icon ? <Icon className="field__icon" size={20} strokeWidth={2} /> : null}
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="field__input"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {isPassword ? (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="field__toggle">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        ) : null}
      </label>
      {error ? <span id={`${name}-error`} className="field__error" role="alert">{error}</span> : null}
    </div>
  )
}
