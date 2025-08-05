import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: any | null; promise: Promise<any> | null } | undefined;
}

// MongoDB connection with caching
let cached: { conn: any | null; promise: Promise<any> | null } | undefined = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectMongo() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(process.env.MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: false },
  uploadedFiles: [{ id: Number, name: String, type: String, size: Number, content: String, lastModified: Number }],
  generatedFiles: { type: Object, required: false },
  timestamp: { type: Date, default: Date.now },
});

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3, backoff: number = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 529 && attempt < retries) {
        console.log(`Attempt ${attempt} failed with 529. Retrying after ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
        continue;
      }
      if (!response.ok) {
        throw new Error(`Anthropic API error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
  throw new Error("Max retries reached");
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const { prompt, existingFiles, uploadedFiles, userId = 'user123' } = await request.json();

    if (!prompt && (!uploadedFiles || uploadedFiles.length === 0)) {
      return NextResponse.json(
        { error: "Prompt or uploaded files are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert full-stack web developer. Generate or update a complete, production-ready React application based on the user's description.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object with file paths as keys and complete file contents as values.
2. Always include these core files: /App.js, /App.css, /index.js, /public/index.html.
3. Use modern React with hooks (useState, useEffect, etc.).
4. Include proper CSS styling - make it beautiful and responsive.
5. Add meaningful functionality, not just placeholder text.
6. Ensure all imports and exports are correct.
7. Use semantic HTML and accessibility best practices.
8. Add interactive elements and state management where appropriate.
9. Ensure the response is a single, valid JSON object with no additional text, markdown, or code fences.
10. Keep the response concise to fit within 8000 tokens, prioritizing essential code and styles.

${existingFiles
        ? `Existing files to modify:
${JSON.stringify(existingFiles, null, 2)}

User request to modify the existing application: ${prompt}

Update the provided files according to the user's request. Preserve unchanged functionality and structure where possible, and only modify or add files as needed to implement the requested changes. Ensure the updated files form a complete, functional React application.`
        : `User request: ${prompt}

Generate a complete, functional React application with beautiful styling and meaningful functionality.`
      }

Example structure:
{
  "/App.js": "complete React component code...",
  "/App.css": "complete CSS styling...",
  "/index.js": "React app entry point...",
  "/public/index.html": "HTML template..."
}`;

    const requestBody = JSON.stringify({
      model: "claude-opus-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: systemPrompt }],
    });

    console.log("Sending request to Anthropic API:", { prompt, model: "claude-opus-4-20250514", hasExistingFiles: !!existingFiles });

    const response = await fetchWithRetry(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: requestBody,
      }
    );

    const data = await response.json();
    console.log("Anthropic API response:", data);

    if (data.stop_reason === "max_tokens") {
      console.warn("Response truncated due to max_tokens limit");
      throw new Error("Response truncated: Increase max_tokens or simplify prompt");
    }

    const responseText = data.content[0]?.text;
    if (!responseText) {
      console.error("No content in response:", data);
      throw new Error("No content generated by Anthropic API");
    }

    // Extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Invalid JSON in response:", responseText);
      throw new Error("No valid JSON found in response");
    }

    let files;
    try {
      files = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      const cleanedJson = jsonMatch[0]
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim();
      try {
        files = JSON.parse(cleanedJson);
      } catch (secondParseError) {
        console.error("Failed to parse JSON after cleaning:", cleanedJson);
        throw new Error("Failed to parse generated content as JSON");
      }
    }

    // Validate that we have the required files
    const requiredFiles = ["/App.js", "/index.js"];
    const missingFiles = requiredFiles.filter((file) => !files[file]);

    if (missingFiles.length > 0) {
      console.warn("Missing required files:", missingFiles);
      if (!files["/index.js"]) {
        files["/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;
      }
      const remainingMissingFiles = requiredFiles.filter((file) => !files[file]);
      if (remainingMissingFiles.length > 0) {
        throw new Error(`Missing required files: ${remainingMissingFiles.join(", ")}`);
      }
    }

    if (!files["/public/index.html"]) {
      files["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    }

    // Save to MongoDB
    const conversation = new Conversation({
      userId,
      prompt,
      uploadedFiles: uploadedFiles || [],
      generatedFiles: files || {},
    });
    await conversation.save();

    return NextResponse.json({ files, conversationId: conversation._id });
  } catch (error) {
    console.error("Error in Anthropic API route:", error);
    let errorMessage = "Failed to generate code";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const conversations = await Conversation.find({ userId }).sort({ timestamp: -1 });
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    return NextResponse.json({ error: "Failed to retrieve conversations" }, { status: 500 });
  }
}