"use client";

import Link from "next/link";
import { useMemo } from "react";

const weeklyHours = [
  { day: "Monday", hours: "9:00 AM - 5:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 5:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 5:00 PM" },
  { day: "Friday", hours: "9:00 AM - 3:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

const hubLocation = "Building 12, Room 152";
const hubEmail = "ottercare@csumb.edu";

export default function HoursPage() {
  const currentDay = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  }, []);

  const todayHours = useMemo(() => {
    return weeklyHours.find((entry) => entry.day === currentDay)?.hours ?? "Unavailable";
  }, [currentDay]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8 text-[#243B53] md:px-8">
      <main className="mx-auto w-full max-w-5xl rounded-3xl border border-[#1D4ED8]/10 bg-white p-5 shadow-[0_18px_50px_rgba(36,59,83,0.08)] md:p-8">

        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#123B7A] md:text-5xl">
          Hours of Operation
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#486581] md:text-base">
          Students can check open hours and avoid peak congestion windows.
        </p>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          <div className="rounded-2xl border border-[#1D4ED8]/10 bg-[#FCFDFF] p-5">
            <p className="text-sm font-medium text-[#486581]">Location</p>
            <p className="mt-1 text-lg font-semibold text-[#123B7A]">{hubLocation}</p>

            <p className="mt-5 text-sm font-medium text-[#486581]">Contact</p>
            <p
              className="mt-1 inline-block text-lg font-semibold text-[#1D4ED8] hover:underline"
            >
              {hubEmail}
            </p>

            <div className="mt-6 rounded-2xl border border-[#D4A62A]/25 bg-[#FFF9EA] p-4">
              <p className="text-sm font-medium text-[#9A6B00]">Today</p>
              <p className="mt-1 text-xl font-semibold text-[#123B7A]">
                {currentDay}
              </p>
              <p className="mt-1 text-base text-[#243B53]">{todayHours}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1D4ED8]/10 bg-white p-5">
            <div className="space-y-2">
              {weeklyHours.map((entry) => {
                const isToday = entry.day === currentDay;
                return (
                  <div
                    key={entry.day}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      isToday
                        ? "border-[#1D4ED8]/25 bg-[#EAF2FF] shadow-sm"
                        : "border-[#1D4ED8]/10 bg-[#FCFDFF]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold ${
                          isToday ? "text-[#123B7A]" : "text-[#243B53]"
                        }`}
                      >
                        {entry.day}
                      </span>
                      {isToday ? (
                        <span className="rounded-full bg-[#123B7A] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                          Today
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`font-medium ${
                        isToday ? "text-[#123B7A]" : "text-[#486581]"
                      }`}
                    >
                      {entry.hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/"
            className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
          >
            Home
          </Link>
          <Link
            href="/admin/hours"
            className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/40 hover:text-[#123B7A]"
          >
            Admin Hours Management
          </Link>
        </div>
      </main>
    </div>
  );
}