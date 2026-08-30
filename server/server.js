import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


app.post("/api/generate-design", async (req, res) => {
  try {
    const {
      idea,
      platform,
      style,
      audience,
    } = req.body;

    if (!idea || !idea.trim()) {
      return res.status(400).json({
        error: "Project idea is required.",
      });
    }

    const prompt = `
You are DesignAI, an expert UI/UX product designer.

Analyze the following product idea and create a structured UX design blueprint.

PRODUCT IDEA:
${idea}

PLATFORM:
${platform}

DESIGN STYLE:
${style}

TARGET AUDIENCE:
${audience}

Return ONLY valid JSON.

Use exactly this structure:

{
  "projectName": "short product name",
  "summary": "short product summary",
  "problem": "problem this product solves",
  "solution": "how the product solves it",
  "targetUsers": [
    "user type 1",
    "user type 2"
  ],
  "goals": [
    "goal 1",
    "goal 2",
    "goal 3"
  ],
  "features": [
    "feature 1",
    "feature 2",
    "feature 3",
    "feature 4",
    "feature 5"
  ],
  "pages": [
    "page 1",
    "page 2",
    "page 3",
    "page 4",
    "page 5"
  ],
  "userFlow": [
    "step 1",
    "step 2",
    "step 3",
    "step 4"
  ],
  "designSystem": {
    "style": "${style}",
    "primaryColor": "hex color",
    "secondaryColor": "hex color",
    "fontStyle": "font recommendation"
  }
}

Make the recommendations practical, modern and suitable for a real product portfolio.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    const design = JSON.parse(text);

    res.json(design);

  } catch (error) {
  console.error("=================================");
  console.error("AI GENERATION ERROR:");
  console.error(error);
  console.error("=================================");

  res.status(500).json({
    error: error.message || "Failed to generate design.",
  });
}
});

app.post("/api/edit-design", async (req, res) => {
  try {
    const {
      editPrompt,
      currentDesign,
    } = req.body;

    if (!editPrompt || !editPrompt.trim()) {
      return res.status(400).json({
        error: "Edit instruction is required.",
      });
    }

    if (!currentDesign) {
      return res.status(400).json({
        error: "Current design is required.",
      });
    }

    const prompt = `
You are DesignAI, an expert UI/UX product designer.

The user wants to modify an existing product design.

CURRENT DESIGN:
${JSON.stringify(currentDesign, null, 2)}

USER'S EDIT REQUEST:
${editPrompt}

Update the design according to the user's request.

IMPORTANT:
- Preserve everything that the user did not ask to change.
- Only modify parts that are relevant to the edit request.
- Keep the result practical and portfolio-quality.
- Return ONLY valid JSON.
- Use exactly the same JSON structure as the current design.

Return this structure:

{
  "projectName": "short product name",
  "summary": "short product summary",
  "problem": "problem this product solves",
  "solution": "how the product solves it",
  "targetUsers": [
    "user type 1",
    "user type 2"
  ],
  "goals": [
    "goal 1",
    "goal 2",
    "goal 3"
  ],
  "features": [
    "feature 1",
    "feature 2",
    "feature 3",
    "feature 4",
    "feature 5"
  ],
  "pages": [
    "page 1",
    "page 2",
    "page 3",
    "page 4",
    "page 5"
  ],
  "userFlow": [
    "step 1",
    "step 2",
    "step 3",
    "step 4"
  ],
  "designSystem": {
    "style": "design style",
    "primaryColor": "hex color",
    "secondaryColor": "hex color",
    "fontStyle": "font recommendation"
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    const updatedDesign = JSON.parse(text);

    res.json(updatedDesign);

  } catch (error) {
    console.error("=================================");
    console.error("AI EDIT ERROR:");
    console.error(error);
    console.error("=================================");

    res.status(500).json({
      error: error.message || "Failed to edit design.",
    });
  }
});

// =====================================
// AI DESIGN EDITOR
// =====================================

app.post("/api/edit-design", async (req, res) => {
  try {
    const {
      editPrompt,
      currentDesign,
    } = req.body;

    if (!editPrompt || !editPrompt.trim()) {
      return res.status(400).json({
        error: "Edit instruction is required.",
      });
    }

    if (!currentDesign) {
      return res.status(400).json({
        error: "Current design is required.",
      });
    }

    const prompt = `
You are DesignAI, an expert UI/UX product designer.

The user wants to modify an existing AI-generated UX design.

USER REQUEST:
${editPrompt}

CURRENT DESIGN:
${JSON.stringify(currentDesign, null, 2)}

Apply the user's requested changes while keeping the rest of the design consistent.

Return ONLY valid JSON.

Keep exactly this structure:

{
  "projectName": "short product name",
  "summary": "short product summary",
  "problem": "problem this product solves",
  "solution": "how the product solves it",
  "targetUsers": [],
  "goals": [],
  "features": [],
  "pages": [],
  "userFlow": [],
  "designSystem": {
    "style": "",
    "primaryColor": "",
    "secondaryColor": "",
    "fontStyle": ""
  }
}

Do not add markdown.
Do not add explanations outside the JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    const updatedDesign = JSON.parse(text);

    res.json(updatedDesign);

  } catch (error) {
    console.error("=================================");
    console.error("AI EDIT ERROR:");
    console.error(error);
    console.error("=================================");

    res.status(500).json({
      error: error.message || "Failed to edit design.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `DesignAI server running on http://localhost:${PORT}`
  );
});