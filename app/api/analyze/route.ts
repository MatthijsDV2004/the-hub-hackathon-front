type AnalyzeRequestBody = {
  apiKey?: string;
  prompt?: string;
  imageBase64?: string;
  mimeType?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const FALLBACK_PROMPT =
  "Describe this image in detail. Include key objects, context, and any text visible in the image.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;

    const apiKeyFromBody = body.apiKey?.trim();
    const apiKeyFromEnv =
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
    const apiKey = apiKeyFromBody || apiKeyFromEnv;
    const imageBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType?.trim() || "image/jpeg";
    const prompt = body.prompt?.trim() || FALLBACK_PROMPT;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Missing API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in Vercel env, or pass apiKey in the request.",
        },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return Response.json({ error: "Missing image data." }, { status: 400 });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    const payload = (await geminiResponse.json()) as GeminiResponse;

    if (!geminiResponse.ok) {
      return Response.json(
        {
          error: payload.error?.message || "Gemini request failed.",
        },
        { status: geminiResponse.status }
      );
    }

    const text =
      payload.candidates
        ?.flatMap((candidate) => candidate.content?.parts || [])
        .map((part) => part.text || "")
        .join("\n")
        .trim() || "No text returned by Gemini.";

    return Response.json({ text });
  } catch {
    return Response.json(
      { error: "Invalid request payload or model response." },
      { status: 500 }
    );
  }
}