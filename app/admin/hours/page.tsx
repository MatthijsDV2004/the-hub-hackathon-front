"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import HexPanel from "../../components/HexPanel";

const defaultWeeklyHours = [
  { day: "Monday", hours: "9:00 AM - 5:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 5:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 5:00 PM" },
  { day: "Friday", hours: "9:00 AM - 3:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

type WeeklyHourEntry = {
  day: string;
  hours: string;
};

type HubInfoPayload = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  hoursOfOperation: string;
};

async function readApiPayload(response: Response): Promise<{
  json: Record<string, unknown> | null;
  text: string;
}> {
  const rawText = await response.text();

  if (!rawText) {
    return { json: null, text: "" };
  }

  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return { json: parsed, text: rawText };
  } catch {
    return { json: null, text: rawText };
  }
}

function normalizeWeeklyHours(value: unknown): WeeklyHourEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const day = typeof row.day === "string" ? row.day.trim() : "";
      const hours = typeof row.hours === "string" ? row.hours.trim() : "";

      if (!day || !hours) {
        return null;
      }

      return { day, hours };
    })
    .filter((entry): entry is WeeklyHourEntry => entry !== null);
}

export default function AdminHoursPage() {
  const [hubName, setHubName] = useState("The Hub");
  const [location, setLocation] = useState("Student Union Basement, Room B18");
  const [description, setDescription] = useState(
    "Students can check open hours and avoid peak congestion windows."
  );
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHourEntry[]>(defaultWeeklyHours);
  const [hubInfoId, setHubInfoId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const serializedHours = useMemo(() => {
    return JSON.stringify(weeklyHours, null, 2);
  }, [weeklyHours]);

  function updateHours(day: string, nextValue: string) {
    setWeeklyHours((current) =>
      current.map((entry) =>
        entry.day === day ? { ...entry, hours: nextValue } : entry
      )
    );
  }

  const loadHubInfo = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/dataconnect/hub-info", {
        method: "GET",
      });

      const { json, text } = await readApiPayload(response);
      const payload = (json || {}) as {
        hub?: HubInfoPayload | null;
        error?: string;
      };

      if (!response.ok) {
        const details =
          payload.error ||
          (text.trim().startsWith("<!DOCTYPE")
            ? "Received HTML instead of JSON from hub API."
            : text.slice(0, 160));

        throw new Error(details || `Failed to load HubInfo (${response.status}).`);
      }

      if (!payload.hub) {
        setHubInfoId(null);
        setWeeklyHours(defaultWeeklyHours);
        return;
      }

      setHubInfoId(payload.hub.id);
      setHubName(payload.hub.name);
      setLocation(payload.hub.location || "");
      setDescription(payload.hub.description || "");

      try {
        const parsedHours = JSON.parse(payload.hub.hoursOfOperation);
        const normalizedHours = normalizeWeeklyHours(parsedHours);

        if (normalizedHours.length) {
          setWeeklyHours(normalizedHours);
        } else {
          setWeeklyHours(defaultWeeklyHours);
        }
      } catch {
        setWeeklyHours(defaultWeeklyHours);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load HubInfo right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHubInfo();
  }, [loadHubInfo]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/dataconnect/hub-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hubInfoId,
          name: hubName,
          location,
          description,
          hoursOfOperation: weeklyHours,
        }),
      });

      const { json, text } = await readApiPayload(response);
      const payload = (json || {}) as {
        success?: boolean;
        mode?: "insert" | "update";
        id?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        const details =
          payload.error ||
          (text.trim().startsWith("<!DOCTYPE")
            ? "Received HTML instead of JSON from hub API."
            : text.slice(0, 160));

        throw new Error(details || `Failed to save HubInfo (${response.status}).`);
      }

      if (payload.id) {
        setHubInfoId(payload.id);
      }

      setSaveMessage(
        payload.mode === "insert"
          ? "Hub information created successfully."
          : "Hub information updated successfully."
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save HubInfo right now."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <HexPanel contentStyle={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Admin Settings</p>
          <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, margin: "0 0 4px" }}>Manage Hub Hours</h1>
          <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0 }}>Configure the Hub details that appear on the student-facing hours page.</p>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <Link href="/admin" style={navLink}>Admin Dashboard</Link>
          <Link href="/hours" style={navLink}>Student Hours</Link>
        </nav>
      </HexPanel>

      <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-[#1D4ED8]/10 bg-[#FCFDFF] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#123B7A]">Hub information</h2>
              <p className="text-sm text-[#486581]">
                {isLoading ? "Loading current settings..." : hubInfoId ? "Editing existing HubInfo" : "Creating first HubInfo record"}
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[#243B53]">
                Hub name
                <input
                  type="text"
                  value={hubName}
                  onChange={(event) => setHubName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
                />
              </label>

              <label className="text-sm font-medium text-[#243B53]">
                Location
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
                />
              </label>

              <label className="text-sm font-medium text-[#243B53] md:col-span-2">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1D4ED8]/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#123B7A]">Weekly hours</h2>
                <p className="mt-1 text-sm text-[#486581]">
                  Enter the display text for each day exactly as it should appear.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {weeklyHours.map((entry) => (
                <div
                  key={entry.day}
                  className="grid gap-3 rounded-xl border border-[#1D4ED8]/10 bg-[#FCFDFF] px-4 py-3 md:grid-cols-[180px_1fr]"
                >
                  <div className="flex items-center text-sm font-semibold text-[#123B7A]">
                    {entry.day}
                  </div>

                  <input
                    type="text"
                    value={entry.hours}
                    onChange={(event) => updateHours(entry.day, event.target.value)}
                    placeholder="9:00 AM - 5:00 PM or Closed"
                    className="w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
                  />
                </div>
              ))}
            </div>
          </section>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {saveMessage ? (
            <div className="rounded-xl border border-[#D4A62A]/25 bg-[#FFF9EA] px-4 py-3 text-sm text-[#9A6B00]">
              {saveMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#D4A62A] px-4 py-2.5 font-medium text-white transition hover:bg-[#B98F1E] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Hub Hours"}
            </button>

            <button
              type="button"
              onClick={() => {
                setWeeklyHours(defaultWeeklyHours);
                setSaveMessage("");
                setError("");
              }}
              className="rounded-lg border border-[#1D4ED8]/15 bg-white px-4 py-2.5 font-medium text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
            >
              Reset to defaults
            </button>

            <button
              type="button"
              onClick={() => void loadHubInfo()}
              className="rounded-lg border border-[#1D4ED8]/15 bg-white px-4 py-2.5 font-medium text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
            >
              Reload saved values
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin"
            className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
          >
            Admin Dashboard
          </Link>
          <Link
            href="/hours"
            className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
          >
            Student Hours Page
          </Link>
        </div>
      </HexPanel>
      </div>
    </div>
  );
}