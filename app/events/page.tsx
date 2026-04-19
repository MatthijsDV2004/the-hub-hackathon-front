import Link from "next/link";
import HexPanel from "../components/HexPanel";

const events = [
  { name: "Fresh Produce Pop-Up", start: "Tuesday 1:00 PM", end: "Tuesday 3:00 PM", seats: "30" },
  { name: "Protein Pantry Refill", start: "Thursday 11:30 AM", end: "Thursday 1:30 PM", seats: "40" },
  { name: "Weekend Grab-and-Go", start: "Friday 4:00 PM", end: "Friday 6:00 PM", seats: "50" },
];

const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

export default function EventsPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        <HexPanel contentStyle={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Student Events</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, margin: "0 0 6px" }}>Events + Peak Hour Queue</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0 }}>Subscribe to Hub events and check expected traffic before you arrive.</p>
          </div>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/" style={navLink}>Home</Link>
            <Link href="/checkin" style={navLink}>Queue Check-In</Link>
            <Link href="/admin/events" style={navLink}>Admin Events</Link>
          </nav>
        </HexPanel>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {events.map(event => (
            <HexPanel key={event.name} fill="var(--fp-surface-secondary)" contentStyle={{ padding: "18px 20px" }}>
              <h2 style={{ color: "var(--fp-text-primary)", fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>{event.name}</h2>
              <p style={{ color: "var(--fp-text-muted)", fontSize: 13, margin: "0 0 4px" }}>{event.start}</p>
              <p style={{ color: "var(--fp-text-muted)", fontSize: 13, margin: "0 0 10px" }}>Ends {event.end}</p>
              <p style={{ color: "var(--fp-button-accent)", fontSize: 13, fontWeight: 700, margin: 0 }}>Capacity: {event.seats}</p>
            </HexPanel>
          ))}
        </div>

      </div>
    </div>
  );
}
