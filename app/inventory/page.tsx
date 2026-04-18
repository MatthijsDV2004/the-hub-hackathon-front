"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type AnalyzeResponse = {
  text?: string;
  error?: string;
};

const DEFAULT_INVENTORY_PROMPT = `
Context:
My school has a Basic Needs Hub where donated groceries are delivered a few times a week by local partners.
Students can receive groceries for free using their student ID, with item limits for some categories.

Task:
Analyze this photo of Hub inventory and produce an inventory snapshot.

Output format:
1) A short scene summary (1-2 sentences).
2) A markdown table with columns:
   - Item Name
   - Package Details (size/count, like "12 oz" or "5-pack")
   - Estimated Quantity Visible
   - Category (dry, refrigerated, frozen, beverage, produce, hygiene, other)
   - Confidence (high/medium/low)
3) A final section called "Notes" with:
   - uncertainty warnings
   - anything blocked/occluded
   - suggestion on what photo angle would improve count accuracy
`.trim();

function extractApiKey(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (!match) {
      continue;
    }

    const [, name, rawValue] = match;
    if (!["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY"].includes(name)) {
      continue;
    }

    return rawValue.trim().replace(/^['\"]|['\"]$/g, "");
  }

  return trimmed.replace(/^['\"]|['\"]$/g, "");
}

function toBase64Data(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const base64 = value.split(",")[1];
      if (!base64) {
        reject(new Error("Could not read image data."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

export default function InventoryPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [envInput, setEnvInput] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_INVENTORY_PROMPT);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractedKey = useMemo(() => extractApiKey(envInput), [envInput]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setAnalysis("");
    setError("");

    if (!file) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setAnalysis("");

    if (!imageFile) {
      setError("Upload an inventory photo first.");
      return;
    }

    setIsLoading(true);
    try {
      const imageBase64 = await toBase64Data(imageFile);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: extractedKey,
          prompt,
          imageBase64,
          mimeType: imageFile.type,
        }),
      });

      const payload = (await response.json()) as AnalyzeResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Inventory parsing failed.");
      }

      setAnalysis(payload.text || "No inventory output returned by the model.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while parsing this inventory photo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,197,94,0.2),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(6,182,212,0.25),transparent_40%),linear-gradient(120deg,#020617,#0f172a_45%,#1e293b)]" />
      <main className="relative z-10 mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
              Hub Inventory Tracker
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Upload shelf photos and estimate inventory with Gemini
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/60"
          >
            Back to Homepage
          </Link>
        </div>

        <p className="mb-6 max-w-4xl text-sm text-slate-300 md:text-base">
          This route is designed for Hub staff. It parses a photo into item names, package details,
          estimated counts, category labels, and confidence notes so students can check stock before
          showing up.
        </p>

        <form className="grid gap-6 xl:grid-cols-[1fr_1.15fr]" onSubmit={onSubmit}>
          <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:p-5">
            <label className="block text-sm font-medium text-slate-200" htmlFor="inventory-image">
              Inventory image
            </label>
            <input
              id="inventory-image"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="block w-full cursor-pointer rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-cyan-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950 hover:border-cyan-300/40"
            />

            <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Inventory photo preview"
                  width={1300}
                  height={1300}
                  unoptimized
                  className="h-80 w-full object-contain"
                />
              ) : (
                <div className="flex h-80 items-center justify-center px-6 text-center text-sm text-slate-400">
                  Upload a shelf, fridge, or pantry photo to preview it here.
                </div>
              )}
            </div>

            <label className="block text-sm font-medium text-slate-200" htmlFor="env-input">
              API key or env line (optional)
            </label>
            <textarea
              id="env-input"
              value={envInput}
              onChange={(event) => setEnvInput(event.target.value)}
              placeholder="GEMINI_API_KEY=AIza..."
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Leave this blank to use GEMINI_API_KEY / GOOGLE_API_KEY from Vercel env.
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:p-5">
            <label className="block text-sm font-medium text-slate-200" htmlFor="prompt-input">
              Inventory prompt
            </label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={14}
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-300/70 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-200 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Analyzing inventory photo..." : "Generate inventory snapshot"}
            </button>

            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">AI inventory output</h2>
              <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                {analysis ||
                  "The inventory summary and item table will appear here after analysis."}
              </pre>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
