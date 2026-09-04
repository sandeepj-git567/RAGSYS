import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // Upload PDF
  // -----------------------------

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploaded(true);

      setMessages([
        {
          role: "assistant",
          content:
            "Your PDF has been processed successfully. Ask me anything about the document.",
        },
      ]);
    } catch (err) {
      setError(err.message);
      setUploaded(false);
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // Ask Question
  // -----------------------------

  const askQuestion = async () => {
    if (!question.trim() || !uploaded || asking) return;

    const userQuestion = question.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setQuestion("");
    setAsking(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  };

  // -----------------------------
  // Enter key
  // -----------------------------

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="app">

      {/* Navbar */}

      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">✦</div>
          <span>RagSys</span>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          AI Online
        </div>
      </nav>

      {/* Main */}

      <main className="container">

        {!uploaded && (
          <section className="hero">

            <div className="badge">
              AI Powered PDF Assistant
            </div>

            <h1>
              Chat with your
              <span> documents.</span>
            </h1>

            <p>
              Upload a PDF and ask questions. RagSys
              finds the relevant information and gives you
              answers based on your document.
            </p>

            {/* Upload */}

            <label className="upload-box">

              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  handleUpload(e.target.files[0])
                }
              />

              <div className="upload-icon">
                📄
              </div>

              <h3>
                {uploading
                  ? "Processing your PDF..."
                  : "Upload your PDF"}
              </h3>

              <p>
                Click to browse or drag and drop
              </p>

              <small>
                PDF files only
              </small>

            </label>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

          </section>
        )}

        {/* Chat */}

        {uploaded && (
          <section className="chat-section">

            <div className="document-bar">

              <div className="document-info">

                <div className="pdf-icon">
                  PDF
                </div>

                <div>
                  <strong>{file?.name}</strong>
                  <span>
                    Document processed successfully
                  </span>
                </div>

              </div>

              <label className="change-file">

                Change PDF

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    handleUpload(e.target.files[0])
                  }
                />

              </label>

            </div>

            {/* Messages */}

            <div className="messages">

              {messages.map((message, index) => (

                <div
                  key={index}
                  className={`message ${
                    message.role
                  }`}
                >

                  <div className="avatar">
                    {message.role === "user"
                      ? "You"
                      : "AI"}
                  </div>

                  <div className="message-content">

                    <div className="message-text">
                      {message.content}
                    </div>

                    {message.sources?.length > 0 && (

                      <div className="sources">

                        <h4>
                          📚 Sources
                        </h4>

                        {message.sources.map(
                          (source, sourceIndex) => (

                            <div
                              className="source"
                              key={sourceIndex}
                            >
                              {source}
                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                </div>

              ))}

              {asking && (
                <div className="message assistant">

                  <div className="avatar">
                    AI
                  </div>

                  <div className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>
              )}

            </div>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            {/* Input */}

            <div className="question-box">

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your PDF..."
                rows="1"
              />

              <button
                onClick={askQuestion}
                disabled={
                  !question.trim() || asking
                }
              >
                ➤
              </button>

            </div>

            <p className="disclaimer">
              Answers are generated from your uploaded
              document.
            </p>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;