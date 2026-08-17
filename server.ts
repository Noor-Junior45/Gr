import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Giriraj Power Kolkata Express" });
  });

  // Server-side AI Assistant endpoint with Google Maps Grounding for Kolkata electrical & hardware hubs
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, userArea, pincode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Provide intelligent electrical fallback if key is not configured
        return res.json({
          text: `For ${userArea || 'Kolkata'} (PIN: ${pincode || '700001'}):
• 1.5 sq mm Wires (Polycab/Havells): Recommended for lighting circuits & 6A switchboards (10A MCB protection).
• 2.5 sq mm Wires: Recommended for Air Conditioners (up to 1.5 Ton), geysers, and kitchen power plugs (16A/20A MCB).
• 4.0 sq mm Wires: Mains sub-meter feeder & heavy induction loads.
• Construction: UltraTech Cement & Tata Tiscon 550D TMT bars are in stock for 60-min delivery from Ezra Street Central Hub.`,
          mapsSources: [
            {
              uri: "https://share.google/iOCruA9J5kluj6PDN",
              title: "Giriraj Power Ezra Street Central Hub, Kolkata"
            }
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemPrompt = `You are the expert Electrical Engineer, Construction Estimator & Store Advisor for Giriraj Power in Kolkata, India.
Customer is located in ${userArea || 'Kolkata Metropolitan Area'} (PIN: ${pincode || '700001'}).
Provide concise, practical electrical advice (wire gauges, MCB ratings, CESC/WBSEDCL standards, conduit sizing, cement and TMT recommendations) and reference Kolkata locations like Ezra Street electrical market, Salt Lake Sector V, New Town, Park Street, or Gariahat where relevant.`;

      // Call Gemini 3.7 Flash with Google Maps tool
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `${systemPrompt}\n\nCustomer question: ${prompt}`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 22.5726, // Kolkata coordinates
                longitude: 88.3639
              }
            }
          }
        }
      });

      const responseText = response.text || "Here is the guidance for Kolkata electrical & hardware needs.";
      
      // Extract Google Maps grounding sources
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsSources: Array<{ uri: string; title?: string }> = [];

      for (const chunk of groundingChunks as Array<{ maps?: { uri?: string; title?: string }; web?: { uri?: string; title?: string } }>) {
        if (chunk.maps?.uri) {
          mapsSources.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || "View on Google Maps"
          });
        } else if (chunk.web?.uri) {
          mapsSources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || "Kolkata Hub Info"
          });
        }
      }

      // Always ensure Google Business link is provided
      if (mapsSources.length === 0) {
        mapsSources.push({
          uri: "https://share.google/iOCruA9J5kluj6PDN",
          title: "Giriraj Power Ezra Street Central Hub, Kolkata"
        });
      }

      res.json({
        text: responseText,
        mapsSources
      });
    } catch (err: unknown) {
      console.error("AI Assistant API error:", err);
      res.json({
        text: `Electrical Recommendation for Kolkata:
• Lighting & Fan circuits: 1.5 sq mm Polycab FR-LSH Copper Wire.
• Air Conditioners (1.5 Ton) & Geysers: 2.5 sq mm Havells HRFR Wire + 16A/20A MCB.
• Main Distribution: 4.0 sq mm pure copper wire + 32A DP Isolator.
Express delivery is available across Kolkata within ~60 minutes!`,
        mapsSources: [
          {
            uri: "https://share.google/iOCruA9J5kluj6PDN",
            title: "Giriraj Power Ezra Street Central Hub, Kolkata"
          }
        ]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Giriraj Power Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
