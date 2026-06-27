import { ArrowRight } from "lucide-react"

export default function PrimaryButton({ children, onClick, type = "button", disabled = false, loading = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn-primary${loading ? " btn-primary--loading" : ""}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="btn-primary__spinner" aria-hidden="true" />
          <span>Please wait…</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <span className="btn-primary__arrow"><ArrowRight size={20} strokeWidth={2.5} /></span>
        </>
      )}
    </button>
  )
}
