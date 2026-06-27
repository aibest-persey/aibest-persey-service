export default function OrDivider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"8px 0" }}>
      <div style={{ flex:1, height:"1px", background:"#e2e5f1" }} />
      <span style={{ fontSize:"13px", color:"#9da2b8", fontWeight:500 }}>Or</span>
      <div style={{ flex:1, height:"1px", background:"#e2e5f1" }} />
    </div>
  )
}
