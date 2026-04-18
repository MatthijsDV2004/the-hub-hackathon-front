"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type AnalyzeResponse = {
  text?: string;
  error?: string;
};

const DEFAULT_PROMPT =
  "Describe this image in detail. Include key objects, context, and any text visible in the image.";

function extractApiKey(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  // Supports pasting either a raw key or an env line such as GEMINI_API_KEY=AIza... .
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

    const unquoted = rawValue.trim().replace(/^['\"]|['\"]$/g, "");
    return unquoted;
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

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [envInput, setEnvInput] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
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
      setError("Upload an image first.");
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
        throw new Error(payload.error || "Image analysis failed.");
      }

      setAnalysis(payload.text || "No text response was returned by the model.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while analyzing the image."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-start justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(251,146,60,0.25),transparent_40%),linear-gradient(125deg,#020617,#0f172a_45%,#1e293b)]" />
      <main className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-8">
        <header className="mb-6 space-y-2 md:mb-8">
          <p className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Vision Sandbox
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Upload an image and analyze it with Gemini 2.5 Flash
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            If you set <strong>GEMINI_API_KEY</strong> or <strong>GOOGLE_API_KEY</strong> in
            Vercel env, you can analyze right away. You can also paste a raw key or env line
            like <strong>GEMINI_API_KEY=...</strong> to override for this request.
          </p>
        </header>

        <form className="grid gap-6 lg:grid-cols-[1fr_1.1fr]" onSubmit={onSubmit}>
          <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:p-5">
            <label className="block text-sm font-medium text-slate-200" htmlFor="image-upload">
              Image
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="block w-full cursor-pointer rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950 hover:border-emerald-300/40"
            />

            <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Uploaded preview"
                  width={1200}
                  height={1200}
                  unoptimized
                  className="h-72 w-full object-contain md:h-80"
                />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-400 md:h-80">
                  Image preview appears here
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:p-5">
            <label className="block text-sm font-medium text-slate-200" htmlFor="env-input">
              API key or env line (optional)
            </label>
            <textarea
              id="env-input"
              value={envInput}
              onChange={(event) => setEnvInput(event.target.value)}
              placeholder="GEMINI_API_KEY=AIza..."
              rows={4}
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-300/60 focus:outline-none"
            />

            <label className="block text-sm font-medium text-slate-200" htmlFor="prompt-input">
              Prompt
            </label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-orange-300/70 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 via-lime-200 to-orange-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Analyzing image..." : "Analyze image"}
            </button>

            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">Model response</h2>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                {analysis || "The model output will show up here after you analyze an image."}
              </pre>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
