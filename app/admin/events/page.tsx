import Link from "next/link";
import HexPanel from "../../components/HexPanel";

const events = [
  { name: "Fresh Produce Pop-Up", start: "Tuesday 1:00 PM", end: "Tuesday 3:00 PM", seats: "30" },
  { name: "Protein Pantry Refill", start: "Thursday 11:30 AM", end: "Thursday 1:30 PM", seats: "40" },
  { name: "Weekend Grab-and-Go", start: "Friday 4:00 PM", end: "Friday 6:00 PM", seats: "50" },
];

const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;
const fieldLabel = { fontSize: 12, fontWeight: 700, color: "var(--fp-text-muted)", display: "block", marginBottom: 6 } as React.CSSProperties;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-primary)", fontSize: 14 };

export default function AdminEventsPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        <HexPanel contentStyle={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Admin Events</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, margin: "0 0 4px" }}>Manage Events & Queue Rules</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0 }}>Create event windows, set capacity, and monitor queue throughput during peak traffic.</p>
          </div>
          <nav style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" style={navLink}>Admin Dashboard</Link>
            <Link href="/events" style={navLink}>Student View</Link>
          </nav>
        </HexPanel>

        {/* Existing events */}
        <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 14px" }}>Upcoming Events</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map(event => (
              <div key={event.name} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ color: "var(--fp-text-primary)", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>{event.name}</p>
                  <p style={{ color: "var(--fp-text-muted)", fontSize: 12, margin: 0 }}>{event.start} – {event.end} · {event.seats} seats</p>
                </div>
                <button disabled style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--fp-input-border)", background: "transparent", color: "var(--fp-text-muted)", fontSize: 12, cursor: "not-allowed" }}>Edit</button>
              </div>
            ))}
          </div>
        </HexPanel>

        {/* Create event form stub */}
        <HexPanel fill="var(--fp-surface-accent)" contentStyle={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 16px" }}>Create New Event</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div><label style={fieldLabel}>Event name</label><input disabled placeholder="e.g. Fresh Produce Pop-Up" style={inputStyle} /></div>
            <div><label style={fieldLabel}>Start time</label><input disabled placeholder="e.g. Tuesday 1:00 PM" style={inputStyle} /></div>
            <div><label style={fieldLabel}>End time</label><input disabled placeholder="e.g. Tuesday 3:00 PM" style={inputStyle} /></div>
            <div><label style={fieldLabel}>Max capacity</label><input disabled placeholder="e.g. 30" style={inputStyle} /></div>
          </div>
          <p style={{ fontSize: 12, color: "var(--fp-text-muted)", margin: "14px 0 0", fontStyle: "italic" }}>Event management backend coming soon — form is a preview only.</p>
        </HexPanel>

        {/* Queue rules info */}
        <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 12px" }}>Planned Queue Controls</p>
          {["Event name, start/end time, and max attendees.", "Queue cut-off rules (close at capacity or N minutes before end).", "Student check-in via ID verification.", "Real-time queue position and wait-time display."].map(item => (
            <p key={item} style={{ color: "var(--fp-text-secondary)", fontSize: 13, margin: "0 0 6px", display: "flex", gap: 8 }}>
              <span style={{ color: "var(--fp-button-accent)", flexShrink: 0 }}>›</span>{item}
            </p>
          ))}
        </HexPanel>

      </div>
    </div>
  );
}
