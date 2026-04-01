import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { image, query } = await req.json();

    let messages;

    if (image) {
      // Vision mode: identify from photo
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are an expert in filmmaking equipment identification. Analyze this image and identify the equipment shown.

Return a JSON object with:
- universe: one of "camera", "lens", "lighting", "audio", "cable", "power", "grip", "monitoring", "storage", "accessory"
- name: the common name (brand + model)
- brand: manufacturer name
- model: specific model name/number
- attributes: object with relevant specs based on the universe:
  - For lens: { lens_type, focal_length, max_aperture, mount, filter_size }
  - For camera: { sensor_size, max_resolution, mount, recording_media }
  - For cable: { connector_type, cable_length }
  - For lighting: { light_type, color_temp, wattage }
  - For audio: { audio_type, connectivity }
  - etc.

Return ONLY valid JSON, no markdown fences.`,
            },
          ],
        },
      ];
    } else if (query) {
      // Text search mode: suggest equipment from reference
      messages = [
        {
          role: "user",
          content: `You are an expert in filmmaking equipment. The user typed: "${query}"

Suggest up to 5 matching equipment items. For each, return:
- universe: one of "camera", "lens", "lighting", "audio", "cable", "power", "grip", "monitoring", "storage", "accessory"
- name: full name (brand + model)
- brand: manufacturer
- model: model name
- attributes: relevant specs object

Return a JSON array of suggestions. ONLY valid JSON, no markdown fences.`,
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide image or query" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 1024,
        messages,
      }),
    });

    const result = await response.json();
    const text = result.content?.[0]?.text ?? "{}";

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
      parsed = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { error: "Could not parse response" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
