import Link from "next/link";
import HexPanel from "./components/HexPanel";

const studentLinks = [
  { href: "/student/inventory", label: "Inventory" },
  { href: "/hours", label: "Hours" },
  { href: "/events", label: "Events" },
  { href: "/checkin", label: "Queue Check-In" },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/inventory", label: "AI Inventory Upload" },
  { href: "/admin/stock", label: "Manual Stock Edit" },
  { href: "/checkout", label: "Checkout Scanner" },
  { href: "/admin/hours", label: "Manage Hours" },
  { href: "/admin/events", label: "Manage Events" },
];

const navLinkStyle = {
  display: "block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--fp-panel-border)",
  color: "var(--fp-text-secondary)",
  fontSize: 15,
  fontWeight: 600,
  textDecoration: "none",
  background: "var(--fp-input-bg)",
  transition: "border-color 0.15s",
} as React.CSSProperties;

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <HexPanel contentStyle={{ padding: "24px 28px" }}>
          <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 6px" }}>
            The Hub
          </p>
          <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, margin: "0 0 10px", lineHeight: 1.1 }}>
            Basic Needs Hub Inventory
          </h1>
          <p style={{ color: "var(--fp-text-secondary)", fontSize: 15, margin: "0 0 18px", maxWidth: 580, lineHeight: 1.6 }}>
            Students can check current groceries before arriving. Staff can upload photos, review AI results, and manage inventory, hours, checkout updates, and events.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/login" style={{ ...navLinkStyle, background: "var(--fp-success)", color: "#fff", border: "1px solid #5a7f56" }}>Login</Link>
            <Link href="/student/inventory" style={{ ...navLinkStyle, background: "var(--fp-button-primary)", color: "#fff" }}>Student Inventory</Link>
            <Link href="/inventory" style={navLinkStyle}>Admin Upload</Link>
          </div>
        </HexPanel>

        {/* Two nav cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 14px" }}>Student Pages</p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {studentLinks.map(link => (
                <Link key={link.href} href={link.href} style={navLinkStyle}>{link.label}</Link>
              ))}
            </nav>
          </HexPanel>

          <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 14px" }}>Admin Pages</p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {adminLinks.map(link => (
                <Link key={link.href} href={link.href} style={navLinkStyle}>{link.label}</Link>
              ))}
            </nav>
          </HexPanel>
        </div>

        {/* What this solves */}
        <HexPanel fill="var(--fp-surface-accent)" contentStyle={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 14px" }}>What This Solves</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Students know what is available before walking to The Hub.",
              "Staff can quickly update shelf inventory from photos.",
              "Checkout scanning helps keep stock counts accurate.",
              "Events and queue pages help with peak-hour planning.",
            ].map(item => (
              <li key={item} style={{ color: "var(--fp-text-secondary)", fontSize: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "var(--fp-button-accent)", marginTop: 2, flexShrink: 0 }}>›</span>
                {item}
              </li>
            ))}
          </ul>
        </HexPanel>

      </div>
    </div>
  );
}
