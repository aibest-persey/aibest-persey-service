export default function PhoneFrame({ children }) {
  return (
    <div style={{
      width: "375px",
      height: "812px",
      background: "#ffffff",
      borderRadius: "40px",
      overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.15)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {children}
    </div>
  )
}
