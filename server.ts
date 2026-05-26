import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard port is 3000
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Safe lazy initializer for Gemini GoogleGenAI SDK to prevent startup crashes if key is initially absent
  let aiClient: GoogleGenAI | null = null;

  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it to your Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Deck Coach report generator
  app.post("/api/coach", async (req, res) => {
    try {
      const { config, overallProbability, indHandtrapProb, indBreakerProb, indBrickProb, indGarnetProb } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Missing deck configuration payload." });
      }

      const client = getAiClient();

      const archetypePrompt = `
You are an elite, championship-winning Yu-Gi-Oh! Deck Building Coach and master statistician. Your goal is to analyze the user's specific deck ratios, custom mathematical metrics, and selected deck strategy/name, then draft a highly professional, encouraging, and competitively sound master strategy guide.

User Deck Specs:
- Total Deck Size: ${config.deckSize} cards
- Starting Hand Size: ${config.handSize} cards
- Deck Name: ${config.deckName || "Unnamed Deck"}
- Deck Strategy Category: ${config.deckStrategy}

Allocated Quantities in Deck:
 - Primary Starters: ${config.starterCount} (Aiming for a minimum of ${config.minStarter} in opening hand, of which ${config.starterExtendersCount || 0} can function as extenders when drawn together to play through interruptions)
- Defensive Hand Traps: ${config.handtrapCount} (Aiming for a minimum of ${config.minHandtrap} in opening hand)
- Going-Second Board Breakers: ${config.breakerCount} (Aiming for a minimum of ${config.minBreaker} in opening hand)
- Versatile Jolly/Flex cards (acting as: ${[config.jollyActsAsStarter !== false ? "Starter" : null, config.jollyActsAsHandtrap ? "Hand Trap" : null, config.jollyActsAsBreaker !== false ? "Board Breaker" : null].filter(Boolean).join(" or ") || "None"}): ${config.jollyCount}
- Hard Garnets (Must NOT draw, ruins plays): ${config.garnetCount} (Aiming for a maximum of ${config.maxGarnet} in opening hand)
- Ordinary Engine Bricks (Clunky draws, but doable): ${config.brickCount} (Aiming for a minimum of ${config.minBrick || 0} in opening hand)

Calculated Combination Probabilities:
- Exact Target Combo Probability: ${Number(overallProbability).toFixed(2)}%
- Probability of drawing 1+ Hand Traps: ${Number(indHandtrapProb).toFixed(1)}%
- Probability of drawing 1+ Board Breakers (including Jollies): ${Number(indBreakerProb).toFixed(1)}%
- Probability of drawing 1+ Soft Engine Bricks: ${Number(indBrickProb).toFixed(1)}%
- Probability of drawing 1+ Hard Garnets: ${Number(indGarnetProb).toFixed(1)}%

Please write a highly polished, master-class coaching evaluation in styled Markdown. Avoid system indicators or generic text. Use structural parts:
1. ### 📊 **Mathematical Appraisal & Consistency Score**
   Evaluate how consistent their target combo/interaction configurations are (${Number(overallProbability).toFixed(2)}% rate). Address whether they are running too many starters and distinguish between overlap redundancy and play extenders (since ${config.starterExtendersCount || 0} of their starters act as extenders, explain how drawing these together scales play resiliency rather than dead weight). Comment on their Garnet risk and soft brick rates under their chosen strategy "${config.deckStrategy}".

2. ### ⚔️ **Strategy Realignment: ${config.deckStrategy}**
   Discuss deckbuilding strategies highly relevant to their strategy choice: "${config.deckStrategy}" and their deck "${config.deckName || "Unnamed"}" (e.g., if "Exodia" or "FTK", detail high-velocity draw options and brick handling; if "Stun" or "Control", refer to trap setups, protection lines, and resource recovery; if "Combo", refer to extender ratios and target boards; if "Self Mill", refer to mills and GY triggers; if "Blind 2nd OTK", refer to breaker ratios and high-power damage pushers). Give tips on how this specific archetype optimizes ratios.

3. ### ⚙️ **Card Count Corrections & Flex Node Advice**
   Suggest concrete mathematical count adjustments they should try in the calculator panel (e.g. increasing/decreasing Starters, reducing/adding Handtraps, utilizing optimal search/draw slots like "Pot of Prosperity", "Triple Tactics Talent", or strategy-specific accelerators to bridge engine gaps). Help them reach an optimal size layout.

4. ### 🛡️ **Resiliency Analysis & Interruption Counters**
   Assess how easily this setup plays around common interruptions (like "Ash Blossom", "Infinite Impermanence", "Droll & Lock Bird", "Effect Veiler", or "Nibiru" depending on the strategy's vulnerabilities, e.g. "FTK" / "Combo" are highly vulnerable to Droll, whereas "Control" or "Stun" ignore it completely). Suggest extenders or counterplays (like "Called by the Grave", "Crossout Designator") to bypass them.

Keep the advice clean, sharp, specific, and full of professional Yu-Gi-Oh! terminology (extenders, board wipes, floodgates, flexible nodes, chain links, active searchers). Use bold key terms!
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: archetypePrompt,
        config: {
          temperature: 0.85,
        }
      });

      res.json({ coaching: response.text });
    } catch (err: any) {
      console.error("AI Coach API execution error:", err);
      res.status(500).json({ error: err.message || "Failed to contact Gemini AI engine." });
    }
  });


  // --- Vite & Production Static File Serving Middleware ---

  if (process.env.NODE_ENV !== "production") {
    // In dev: mount Vite Dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production: Serve built static front-end assets directly from '/dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to host 0.0.0.0 and standard port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[YGO Deck Coach Server] Standalone full-stack service running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server startup crash:", err);
});
