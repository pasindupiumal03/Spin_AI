"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./walletcontext/WalletContext";
import {
  Loader2,
  Sparkles,
  Code,
  Trash2,
  Upload,
  File,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  Zap,
  Copy,
  ChevronDown,
  ChevronUp,
  Wallet,
  LogOut,
  Image,
  Text,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  lastModified: number;
}

interface Conversation {
  _id: string;
  prompt: string;
  uploadedFiles: UploadedFile[] | null;
  generatedFiles: { [key: string]: string } | null;
  timestamp: string;
}

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const { walletAddress, connectWallet, disconnectWallet, connecting } =
    useWallet();
  const [expandedFiles, setExpandedFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize or retrieve userId based on wallet address
  useEffect(() => {
    let userId = localStorage.getItem("userId");
    if (!userId && walletAddress) {
      userId = walletAddress;
      localStorage.setItem("userId", userId);
    }
    if (userId) {
      fetchConversations(userId);
    } else {
      setConversations([]);
    }

    const storedFiles = sessionStorage.getItem("generatedFiles");
    const storedPrompt = sessionStorage.getItem("originalPrompt");
    const storedUploadedFiles = sessionStorage.getItem("uploadedFiles");

    if (storedFiles && storedPrompt) {
      setOriginalPrompt(storedPrompt);
    }
    if (storedUploadedFiles) {
      setUploadedFiles(JSON.parse(storedUploadedFiles));
    }
  }, [walletAddress]);

  const fetchConversations = async (userId: string) => {
    try {
      const response = await fetch(`/api/anthropic?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      } else {
        setError(data.error || "Failed to load conversation history");
      }
    } catch (err) {
      setError("Failed to load conversation history");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (fileType.includes("text/") || fileType.includes("json"))
      return <FileText className="w-4 h-4" />;
    if (
      fileType.includes("javascript") ||
      fileType.includes("typescript") ||
      fileType.includes("python") ||
      fileType.includes("java")
    )
      return <FileCode className="w-4 h-4" />;
    if (
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    )
      return <FileSpreadsheet className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getSyntaxLanguage = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      default:
        return "text";
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    setError("File content copied to clipboard!");
    setTimeout(() => setError(""), 3000);
  };

  const toggleFileContent = (filePath: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  };

  const handleFileUpload = async (files: File[], isImage: boolean = false) => {
    const supportedFormats = isImage
      ? ["image/png", "image/jpeg", "image/gif", "image/svg+xml"]
      : [
          "text/plain",
          "text/csv",
          "application/json",
          "text/html",
          "text/css",
          "text/javascript",
          "application/javascript",
          "text/typescript",
          "application/typescript",
          "text/python",
          "application/python",
          "text/java",
          "application/java",
          "text/xml",
          "application/xml",
          "text/markdown",
          "text/yaml",
          "application/yaml",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

    const newFiles = [];

    for (let file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      if (!supportedFormats.includes(file.type)) {
        setError(`File type "${file.type}" is not supported.`);
        continue;
      }

      try {
        let content;

        if (file.type.startsWith("image/")) {
          content = await new Promise<string | ArrayBuffer>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target && e.target.result) {
                resolve(e.target.result);
              }
            };
            reader.readAsDataURL(file);
          });
        } else if (file.type === "application/pdf") {
          content = "[PDF file - will be processed by AI]";
        } else if (
          file.type.includes("excel") ||
          file.type.includes("spreadsheet")
        ) {
          content = "[Excel file - will be processed by AI]";
        } else {
          content = await new Promise<string | ArrayBuffer>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target && e.target.result) {
                resolve(e.target.result);
              }
            };
            reader.readAsText(file);
          });
        }

        newFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
          lastModified: file.lastModified,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        setError(`Failed to read file "${file.name}"`);
      }
    }

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    sessionStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
  };

  const handleTextContent = () => {
    setShowTextModal(true);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textContent.trim()) {
      // Create a file-like object that matches the UploadedFile interface
      const textFile: UploadedFile = {
        id: Date.now(),
        name: `text_input_${Date.now()}.txt`,
        type: 'text/plain',
        size: new TextEncoder().encode(textContent).length,
        content: textContent,
        lastModified: Date.now(),
      };
      
      // Add to uploaded files
      const updatedFiles = [...uploadedFiles, textFile];
      setUploadedFiles(updatedFiles);
      sessionStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
      
      setTextContent('');
      setShowTextModal(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.relatedTarget as Node;
    if (!e.currentTarget.contains(target)) {
      setIsDragging(false);
    }
  };

  const removeFile = (fileId: number) => {
    const updatedFiles = uploadedFiles.filter((file) => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    sessionStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) {
      setError(
        "Please describe what you want to build or upload files to generate code from"
      );
      return;
    }

    if (!walletAddress && !localStorage.getItem("userId")) {
      setError("Please connect your wallet to create a project");
      return;
    }

    setIsGenerating(true);
    setIsNavigating(true);
    setError("");

    const userId = localStorage.getItem("userId") || walletAddress;

    const generationRequest = {
      prompt,
      existingFiles: null,
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
      isGenerating: true,
      startTime: Date.now(),
      userId,
    };

    sessionStorage.removeItem("generatedFiles");
    sessionStorage.setItem(
      "generationRequest",
      JSON.stringify(generationRequest)
    );
    sessionStorage.setItem("originalPrompt", prompt);
    sessionStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));

    setTimeout(() => {
      router.push("/workspace");
    }, 300);

    try {
      console.log("Starting code generation with prompt:", prompt);

      const requestBody = {
        prompt,
        existingFiles: null,
        uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
        uploadedFilesCount: uploadedFiles.length,
        userId,
      };

      console.log("Sending request to API with body:", {
        promptLength: prompt.length,
        hasExistingFiles: false,
        uploadedFilesCount: uploadedFiles.length,
        userId,
      });

      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `API request failed with status ${response.status}: ${
            errorText || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.error) {
        console.error("API returned error:", data.error);
        throw new Error(data.error);
      }

      if (data.files) {
        if (data.userId && !localStorage.getItem("userId")) {
          localStorage.setItem("userId", data.userId);
        }

        const newConversation = {
          _id: data.conversationId,
          prompt,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
          generatedFiles: data.files,
          timestamp: new Date().toISOString(),
        };

        sessionStorage.setItem("generatedFiles", JSON.stringify(data.files));
        sessionStorage.setItem("generationComplete", "true");
        sessionStorage.removeItem("generationRequest");

        setConversations((prev) => [newConversation, ...prev]);
      } else {
        throw new Error("No files generated");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);

      const generationError = {
        error:
          errorMessage.includes("truncate") ||
          errorMessage.includes("max_tokens")
            ? "Response too large. Try a simpler prompt or try again later."
            : errorMessage.includes("529")
            ? "Anthropic API is temporarily unavailable. Please try again later."
            : `Failed to generate code: ${errorMessage}`,
      };

      sessionStorage.setItem(
        "generationError",
        JSON.stringify(generationError)
      );
      sessionStorage.removeItem("generationRequest");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearProject = () => {
    setPrompt("");
    setError("");
    setUploadedFiles([]);
    setSelectedConversation(null);
    setExpandedFiles({});
    fetchConversations(localStorage.getItem("userId") || walletAddress || "");
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const userId = localStorage.getItem("userId") || walletAddress;
      if (!userId) return;
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Update local state
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      
      // If the deleted conversation is currently selected, clear the selection
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
      }
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    sessionStorage.setItem(
      "generatedFiles",
      JSON.stringify(conversation.generatedFiles || {})
    );
    sessionStorage.setItem("originalPrompt", conversation.prompt || "");
    sessionStorage.setItem(
      "uploadedFiles",
      JSON.stringify(conversation.uploadedFiles || [])
    );

    router.push("/workspace");
  };

  const examples = [
    "Build a meme coin landing page",
    "Create a leaderboard for token holders",
    "Make a dashboard for community points",
    "Create a to-do app with dark mode",
    "Build a feedback form with emoji reactions",
    "Start a blank app with React + Tailwind",
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Refresh page"
          >
            <img
              src="/logo.png"
              alt="Spin Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-semibold">Spin</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-300">
                {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
              </span>
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  disconnectWallet();
                  localStorage.removeItem("userId");
                  setConversations([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Disconnect wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-1.5 bg-lime-500 text-black rounded-lg hover:bg-lime-400 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">
            Build from a <span className="text-lime-400">single prompt</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Go from idea to live app in minutes using natural language. Powered
            by $SPIN.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-8">
            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Attached Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-gray-400">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input Area */}
            <div
              className={`relative ${
                isDragging
                  ? "ring-2 ring-lime-400 ring-opacity-50 rounded-xl"
                  : ""
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="What would you like to build?"
                className={`w-full h-32 p-4 pr-12 text-lg bg-gray-800 border border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all placeholder-gray-500 text-white ${
                  isDragging ? "border-lime-400 bg-lime-900/20" : ""
                }`}
                disabled={isGenerating}
              />

              {/* Upload Options Button */}
              <div className="absolute bottom-3 left-3">
                <button
                  onClick={() => setShowUploadOptions(!showUploadOptions)}
                  className="px-3 py-1.5 bg-lime-500 text-black rounded-full hover:bg-lime-400 transition-colors text-sm font-medium flex items-center gap-2"
                  disabled={isGenerating}
                >
                  <Upload className="w-4 h-4" />
                  Add
                </button>
                {showUploadOptions && (
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 w-48 z-10">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <File className="w-4 h-4" />
                      Upload File
                    </button>
                    <button
                      onClick={handleTextContent}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Text className="w-4 h-4" />
                      Add Text Content
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Image className="w-4 h-4" />
                      Upload Image
                    </button>
                  </div>
                )}
              </div>

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-lime-900/20 border-2 border-dashed border-lime-400 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-lime-400 font-medium mb-1">
                      Drop files here to attach
                    </p>
                    <p className="text-sm text-lime-300">
                      Images, Documents, Code files, CSV, JSON, PDF
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(Array.from(e.target.files || []))
                }
                accept=".txt,.csv,.json,.html,.css,.js,.ts,.py,.java,.xml,.md,.yml,.yaml,.pdf,.xlsx,.xls,.doc,.docx"
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(Array.from(e.target.files || []), true)
                }
                accept=".png,.jpg,.jpeg,.gif,.svg"
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            {showTextModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium text-white mb-4">Add Text Content</h3>
                  <form onSubmit={handleTextSubmit}>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter your text here..."
                      className="w-full h-32 p-3 bg-gray-700 text-white rounded-lg mb-4 resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowTextModal(false)}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-lime-500 text-black rounded-lg text-sm font-medium hover:bg-lime-400 transition-colors"
                        disabled={!textContent.trim()}
                      >
                        Add Text
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end mt-6">

              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating || (!prompt.trim() && uploadedFiles.length === 0)
                }
                className="px-8 py-3 bg-lime-400 text-black rounded-xl hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Navigating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate App
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="border-t border-gray-800 bg-gray-900/50 p-6">
            <div className="flex flex-wrap justify-center gap-3">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-sm px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <div className="mt-10 mb-10">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Conversation History
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`group relative p-4 pr-12 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                    selectedConversation?._id === conversation._id
                      ? "ring-2 ring-lime-400"
                      : ""
                  }`}
                >
                  <button
                    onClick={(e) => handleDeleteConversation(conversation._id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {conversation.prompt || "Files uploaded"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversation.timestamp).toLocaleString()}
                  </p>
                  {(conversation.uploadedFiles?.length ?? 0) > 0 && (
                    <p className="text-xs text-gray-400">
                      {conversation.uploadedFiles!.length} file(s) uploaded
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Conversation Details */}
        {selectedConversation && (
          <div className="mb-8 p-6 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Selected Conversation
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              <strong>Prompt:</strong>{" "}
              {selectedConversation.prompt || "No prompt provided"}
            </p>
            {(selectedConversation.uploadedFiles?.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Uploaded Files:</strong>
                </p>
                <div className="space-y-2">
                  {selectedConversation.uploadedFiles!.map((file) => (
                    <div key={file.id} className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {getFileIcon(file.type)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedConversation.generatedFiles &&
              Object.keys(selectedConversation.generatedFiles).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    <strong>Generated Files:</strong>
                  </p>
                  <div className="space-y-2">
                    {Object.entries(selectedConversation.generatedFiles).map(
                      ([filePath, content]) => (
                        <div key={filePath} className="bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <div className="text-gray-400">
                                {getFileIcon(filePath.split(".").pop() || "")}
                              </div>
                              <p className="text-sm text-gray-300">
                                {filePath}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(content)}
                                className="p-1 text-gray-400 hover:text-lime-400 transition-colors"
                                title="Copy file content"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleFileContent(filePath)}
                                className="p-1 text-gray-400 hover:text-lime-400 transition-colors"
                                title={
                                  expandedFiles[filePath]
                                    ? "Hide content"
                                    : "Show content"
                                }
                              >
                                {expandedFiles[filePath] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          {expandedFiles[filePath] && (
                            <div className="p-3 border-t border-gray-700">
                              <SyntaxHighlighter
                                language={getSyntaxLanguage(filePath)}
                                style={vscDarkPlus}
                                customStyle={{
                                  background: "transparent",
                                  padding: "1rem",
                                  borderRadius: "0.5rem",
                                  maxHeight: "300px",
                                  overflowY: "auto",
                                }}
                              >
                                {content}
                              </SyntaxHighlighter>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;