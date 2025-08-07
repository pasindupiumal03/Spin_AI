import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: any | null; promise: Promise<any> | null } | undefined;
}

// MongoDB connection with caching
let cached: { conn: any | null; promise: Promise<any> | null } | undefined =
  globalThis.mongoose;

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

    cached!.promise = mongoose
      .connect(process.env.MONGODB_URI!, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true,
  },
  prompt: { type: String, required: false },
  uploadedFiles: [
    {
      id: Number,
      name: String,
      type: String,
      size: Number,
      content: String,
      lastModified: Number,
    },
  ],
  generatedFiles: { type: Object, required: false },
  timestamp: { type: Date, default: Date.now },
});

// Ensure the schema is only defined once
const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = 3,
  backoff: number = 1000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 529 && attempt < retries) {
        console.log(
          `Attempt ${attempt} failed with 529. Retrying after ${backoff}ms...`
        );
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
    const {
      prompt,
      existingFiles,
      uploadedFiles,
      userId, // Accept userId from request
    } = await request.json();

    if (!prompt && (!uploadedFiles || uploadedFiles.length === 0)) {
      return NextResponse.json(
        { error: "Prompt or uploaded files are required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    const systemPrompt = `You are an AI Assistant experienced in React Development.\n\nGUIDELINES:\n- Tell user what you are building.\n- Response less than 15 lines.\n- Skip code examples and commentary.\n\nGenerate a programming code structure for a React project using Vite. Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. The output should use Tailwind CSS for styling, without any third-party dependencies or libraries, except for icons from the lucide-react library, which should only be used when necessary. Available icons include: Heart, Shield, Clock, Users, Play, Home, Search, Menu, User, Settings, Mail, Bell, Calendar, Star, Upload, Download, Trash, Edit, Plus, Minus, Check, X, and ArrowRight. For example, you can import an icon as import { Heart } from \"lucide-react\" and use it in JSX as <Heart className=\"\" />.\n\nReturn the response in JSON format with the following schema:\n{\n  \"projectTitle\": \"\",\n  \"explanation\": \"\",\n  \"files\": {\n    "/App.js": {\n      \"code\": \"\"\n    },\n    ...\n  },\n  \"generatedFiles\": []\n}\n\nEnsure the files field contains all created files, and the generatedFiles field lists all the filenames. Each file's code should be included in the code field, following this example:\nfiles:{\n  "/App.js": {\n    \"code\": \"import React from 'react';\\nimport './styles.css';\\nexport default function App() {\\n  return (\\n    <div className='p-4 bg-gray-100 text-center'>\\n      <h1 className='text-2xl font-bold text-blue-500'>Hello, Tailwind CSS with Sandpack!</h1>\\n      <p className='mt-2 text-gray-700'>This is a live code editor.</p>\\n    </div>\\n  );\\n}\"\n  }\n}\nAdditionally, include an explanation of the project's structure, purpose, and functionality in the explanation field. Make the response concise and clear in one paragraph.\n- When asked then only use this package to import, here are some packages available to import and use (date-fns,react-chartjs-2,\"firebase\",\"@google/generative-ai\" ) only when it required\n- For placeholder images, please use a https://archive.org/download/placeholder-image/placeholder-image.jpg\n- Add Emoji icons whenever needed to give good user experinence\n- all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.\n- By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.\n- Use icons from lucide-react for logos.\n- Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.\n\n${existingFiles ? `Existing files to modify:\n${JSON.stringify(existingFiles, null, 2)}\n\nUser request to modify the existing application: ${prompt}\n\nUpdate the provided files according to the user's request. Preserve unchanged functionality and structure where possible, and only modify or add files as needed to implement the requested changes. Ensure the updated files form a complete, functional React application.` : `User request: ${prompt}\n\nGenerate a complete, functional React application with beautiful styling and meaningful functionality.`}\n`;

    const requestBody = JSON.stringify({
      model: "claude-opus-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: systemPrompt }],
    });

    console.log("Sending request to Anthropic API:", {
      prompt,
      model: "claude-opus-4-20250514",
      hasExistingFiles: !!existingFiles,
    });

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
      throw new Error(
        "Response truncated: Increase max_tokens or simplify prompt"
      );
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

    let files: { [key: string]: string };
    try {
      files = JSON.parse(jsonMatch[0]) as { [key: string]: string };
    } catch (parseError) {
      const cleanedJson = jsonMatch[0]
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim();
      try {
        files = JSON.parse(cleanedJson) as { [key: string]: string };
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
      const remainingMissingFiles = requiredFiles.filter(
        (file) => !files[file]
      );
      if (remainingMissingFiles.length > 0) {
        throw new Error(
          `Missing required files: ${remainingMissingFiles.join(", ")}`
        );
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

    // Return userId along with files and conversationId
    return NextResponse.json({ files, conversationId: conversation._id, userId });
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
    const userId = searchParams.get("userId");

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const conversations = await Conversation.find({ userId }).sort({
      timestamp: -1,
    });
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    return NextResponse.json(
      { error: "Failed to retrieve conversations" },
      { status: 500 }
    );
  }
}