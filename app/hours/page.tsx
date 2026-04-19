"use client";

import Link from "next/link";
import { useMemo } from "react";
import HexPanel from "../components/HexPanel";

const weeklyHours = [
  { day: "Monday",    hours: "9:00 AM - 5:00 PM" },
  { day: "Tuesday",   hours: "9:00 AM - 5:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday",  hours: "9:00 AM - 5:00 PM" },
  { day: "Friday",    hours: "9:00 AM - 3:00 PM" },
  { day: "Saturday",  hours: "Closed" },
  { day: "Sunday",    hours: "Closed" },
];

const hubLocation = "Building 12, Room 152";
const hubEmail    = "ottercare@csumb.edu";

const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

export default function HoursPage() {
  const currentDay = useMemo(() => new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()), []);
  const todayHours = useMemo(() => weeklyHours.find(e => e.day === currentDay)?.hours ?? "Unavailable", [currentDay]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        <HexPanel contentStyle={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>The Hub</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, margin: "0 0 4px" }}>Hours of Operation</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0 }}>Check open hours and avoid peak congestion windows.</p>
          </div>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/" style={navLink}>Home</Link>
            <Link href="/admin/hours" style={navLink}>Admin Hours</Link>
          </nav>
        </HexPanel>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* Location & today */}
          <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Location</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--fp-text-primary)", margin: 0 }}>{hubLocation}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Contact</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fp-button-accent)", margin: 0 }}>{hubEmail}</p>
            </div>
            <HexPanel fill="var(--fp-surface-accent)" contentStyle={{ padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Today</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--fp-text-primary)", margin: "0 0 2px" }}>{currentDay}</p>
              <p style={{ fontSize: 14, color: "var(--fp-text-secondary)", margin: 0 }}>{todayHours}</p>
            </HexPanel>
          </HexPanel>

          {/* Weekly schedule */}
          <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fp-text-muted)", margin: "0 0 12px" }}>Weekly Schedule</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {weeklyHours.map(entry => {
                const isToday = entry.day === currentDay;
                return (
                  <div key={entry.day} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: 8,
                    background: isToday ? "rgba(61,90,138,0.4)" : "rgba(255,255,255,0.03)",
                    border: isToday ? "1px solid var(--fp-panel-border)" : "1px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--fp-text-primary)" : "var(--fp-text-secondary)" }}>{entry.day}</span>
                      {isToday && <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--fp-panel-border)", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>Today</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? "var(--fp-text-primary)" : "var(--fp-text-muted)" }}>{entry.hours}</span>
                  </div>
                );
              })}
            </div>
          </HexPanel>
        </div>

      </div>
    </div>
  );
}
