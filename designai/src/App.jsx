import { useState, useEffect } from "react";
import "./index.css";
import generateDesign from "./services/aiService";
import {
  signUpWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  observeAuthState,
} from "./services/authService";

function App() {
  const [idea, setIdea] = useState("");

  const [platform, setPlatform] =
    useState("Web Application");

  const [style, setStyle] =
    useState("Modern Minimal");

  const [audience, setAudience] =
    useState("Students");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [result, setResult] =
    useState(null);

 const [editPrompt, setEditPrompt] = useState("");
const [isEditing, setIsEditing] = useState(false);
const [editMessage, setEditMessage] = useState("");
const [designHistory, setDesignHistory] = useState([]);
const [isSaved, setIsSaved] = useState(false);

const [showAuth, setShowAuth] = useState(false);
const [authMode, setAuthMode] = useState("login");

const [authName, setAuthName] = useState("");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");

const [authError, setAuthError] = useState("");
const [authLoading, setAuthLoading] = useState(false);

const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  const unsubscribe = observeAuthState((user) => {
    setCurrentUser(user);
  });

  return () => unsubscribe();
}, []);
useEffect(() => {
  const savedDesign = localStorage.getItem(
    "designai_saved_design"
  );

  if (savedDesign) {
    try {
      const design = JSON.parse(savedDesign);

      setResult(design);
      setIsSaved(true);
    } catch (error) {
      console.error(
        "Failed to restore saved design:",
        error
      );
    }
  }
}, []);

  const handleGenerate = async () => {
  if (!idea.trim()) {
    alert("Please describe your project idea first.");
    return;
  }

  setIsEditing(true);

setDesignHistory((prev) => [
  ...prev,
  result,
]);

try {
    const design = await generateDesign({
      idea: idea.trim(),
      platform,
      style,
      audience,
    });

    console.log("AI Design Generated:", design);

    setResult(design);

  } catch (error) {
    console.error("Generation failed:", error);

    alert(
      error.message ||
      "Something went wrong while generating your design."
    );

  } finally {
    setIsGenerating(false);
  }
};

const handleAIEdit = async () => {
  console.log("AI EDIT BUTTON CLICKED");

  if (!editPrompt.trim()) {
    alert("Please describe what you want to change.");
    return;
  }

  if (!result) {
    alert("Please generate a prototype first.");
    return;
  }

  setIsEditing(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/edit-design",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editPrompt: editPrompt.trim(),
          currentDesign: result,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Gemini quota / rate limit
      if (
        response.status === 429 ||
        data.error?.includes("quota") ||
        data.error?.includes("RESOURCE_EXHAUSTED")
      ) {
        throw new Error(
          "DesignAI has temporarily reached its AI usage limit. Please wait a little while and try again."
        );
      }

      throw new Error(
        data.error || "Unable to update the design right now."
      );
    }

    setResult(data);
setEditPrompt("");
setEditMessage("✦ Design updated successfully");

  } catch (error) {
    console.error("AI edit failed:", error);

    alert(
      error.message ||
      "DesignAI couldn't update your prototype. Please try again."
    );

  } finally {
    setIsEditing(false);
  }
};

const handleExportDesign = () => {
  if (!result) {
    alert("Please generate a prototype first.");
    return;
  }

  const designText = `
DESIGN AI — UX DESIGN BLUEPRINT
================================

PROJECT
${result.projectName || "Untitled Project"}

SUMMARY
${result.summary || "N/A"}

PROBLEM
${result.problem || "N/A"}

SOLUTION
${result.solution || "N/A"}

TARGET USERS
${(result.targetUsers || [])
  .map((item) => `• ${item}`)
  .join("\n")}

GOALS
${(result.goals || [])
  .map((item) => `• ${item}`)
  .join("\n")}

FEATURES
${(result.features || [])
  .map((item) => `• ${item}`)
  .join("\n")}

PAGES
${(result.pages || [])
  .map((item) => `• ${item}`)
  .join("\n")}

USER FLOW
${(result.userFlow || [])
  .map((item) => `• ${item}`)
  .join("\n")}

DESIGN SYSTEM
Style: ${result.designSystem?.style || "N/A"}
Primary Color: ${result.designSystem?.primaryColor || "N/A"}
Secondary Color: ${result.designSystem?.secondaryColor || "N/A"}
Font: ${result.designSystem?.fontStyle || "N/A"}
`;

  const blob = new Blob([designText], {
    type: "text/plain",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `${result.projectName || "designai"}-blueprint.txt`;

  link.click();

  URL.revokeObjectURL(url);
};


// =====================================
// LOAD SAVED DESIGN
// =====================================

const handleLoadSavedDesign = () => {
  const savedDesign = localStorage.getItem(
    "designai_saved_design"
  );

  if (!savedDesign) {
    alert("No saved design found.");
    return;
  }

  try {
    const design = JSON.parse(savedDesign);

    setResult(design);
    setEditMessage("✦ Saved design loaded successfully");
  } catch (error) {
    console.error("Failed to load saved design:", error);
    alert("Could not load the saved design.");
  }
};

const handleClearSavedDesign = () => {
  const confirmed = window.confirm(
    "Are you sure you want to remove the saved design?"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem("designai_saved_design");

  setIsSaved(false);
  setResult(null);
  setEditMessage("✦ Saved design removed");
};

const handleNewDesign = () => {
  const confirmed = window.confirm(
    "Start a new design? Your current design will be cleared from the workspace."
  );

  if (!confirmed) {
    return;
  }

  setResult(null);
  setIsSaved(false);
  setEditPrompt("");
  setEditMessage("");
};

useEffect(() => {
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "n") {
      event.preventDefault();
      handleNewDesign();
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, []);

const handleAuthSubmit = async (event) => {
  event.preventDefault();

  setAuthError("");
  setAuthLoading(true);

  try {
    if (authMode === "signup") {
      await signUpWithEmail(
        authName,
        authEmail,
        authPassword
      );
    } else {
      await loginWithEmail(
        authEmail,
        authPassword
      );
    }

    setShowAuth(false);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
  } catch (error) {
    console.error("Authentication error:", error);

    setAuthError(
      error.code === "auth/email-already-in-use"
        ? "This email is already registered."
        : error.code === "auth/invalid-credential"
        ? "Invalid email or password."
        : error.code === "auth/weak-password"
        ? "Password should be at least 6 characters."
        : "Something went wrong. Please try again."
    );
  } finally {
    setAuthLoading(false);
  }
};

const handleGoogleLogin = async () => {
  setAuthError("");
  setAuthLoading(true);

  try {
    await loginWithGoogle();
    setShowAuth(false);
  } catch (error) {
    console.error("Google authentication error:", error);

    setAuthError(
      "Google sign-in failed. Please try again."
    );
  } finally {
    setAuthLoading(false);
  }
};

const handleLogout = async () => {
  try {
    await logoutUser();
  } catch (error) {
    console.error("Logout error:", error);
  }
};

const handleResetWorkspace = () => {
  const confirmed = window.confirm(
    "Reset the workspace? This will remove the current design and saved design."
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem("designai_saved_design");

  setResult(null);
  setIsSaved(false);
  setEditPrompt("");
  setEditMessage("");
  setDesignHistory([]);
};

  /* =====================================
     RESULT STUDIO
  ===================================== */

  if (result) {
    return (
      <div className="studio">

        {/* Studio Header */}

        <header className="studio-header">

  <div className="studio-title">

    <div>
      <p>DESIGN PROJECT</p>
      <h2>{result.projectName}</h2>
    </div>

  </div>

  {isSaved && (
  <span className="saved-status">
    ● Saved locally
  </span>
)}

  <div className="studio-actions">

     <button
  className="secondary-button"
  onClick={handleNewDesign}
>
  + New Design
</button>

    <button
      className="export-design-btn"
      onClick={handleExportDesign}
    >
      ↓ Export Design
    </button>

            <button
  className="secondary-button"
  onClick={() => {
    localStorage.setItem(
      "designai_saved_design",
      JSON.stringify(result)
    );

    setEditMessage("✦ Design saved successfully");
    setIsSaved(true);
  }}
>
  {isSaved ? "✓ Saved" : "Save"}
</button>

<button
  className="secondary-button"
  onClick={handleLoadSavedDesign}
>
  Load
</button>

<button
  className="secondary-button"
  onClick={handleClearSavedDesign}
>
  Clear Saved
</button>

<button
  className="secondary-button"
  onClick={handleResetWorkspace}
>
  Reset
</button>

            <button className="primary-small-button">
              Export
            </button>

          </div>
          <div className="keyboard-hint">
  <span>⌘ / Ctrl + N</span>
  <small>New Design</small>
</div>

        </header>


        {/* Studio Body */}

        <div className="studio-body">

          {/* LEFT PANEL */}

          <aside className="insights-panel">

            <div className="panel-heading">

              <div className="panel-icon">
                ✦
              </div>

              <div>
                <h3>AI Design Analysis</h3>

                <span>
                  Generated by DesignAI
                </span>
              </div>

            </div>


            {/* Summary */}

            <div className="insight-section">

              <label>PROJECT SUMMARY</label>

              <p className="summary-text">
                {result.summary}
              </p>

            </div>


            {/* Users */}

            <div className="insight-section">

              <label>🎯 TARGET USERS</label>

              <div className="tag-list">

                {result.targetUsers.map(
                  (user, index) => (
                    <span key={index}>
                      {user}
                    </span>
                  )
                )}

              </div>

            </div>


            {/* Goals */}

            <div className="insight-section">

              <label>🎯 USER GOALS</label>

              <ul className="goal-list">

                {result.goals.map(
                  (goal, index) => (
                    <li key={index}>
                      <span>✓</span>
                      {goal}
                    </li>
                  )
                )}

              </ul>

            </div>


            {/* Pages */}

            <div className="insight-section">

              <label>🧭 RECOMMENDED PAGES</label>

              <div className="page-list">

                {result.pages.map(
                  (page, index) => (
                    <div
                      className="page-item"
                      key={index}
                    >
                      <span>
                        {index + 1}
                      </span>

                      {page}
                    </div>
                  )
                )}

              </div>

            </div>


            {/* Design Info */}

            <div className="insight-section">

              <label>🎨 DESIGN DIRECTION</label>

              <div className="design-info">

                <div>
                  <span>Platform</span>
                  <strong>
                    {result.platform}
                  </strong>
                </div>

                <div>
                  <span>Style</span>
                  <strong>
                    {result.designStyle}
                  </strong>
                </div>

              </div>

            </div>

          </aside>


          {/* RIGHT SIDE */}

          <main className="prototype-area">

            {/* Prototype Toolbar */}

            <div className="prototype-toolbar">

              <div>

                <h3>Prototype Preview</h3>

                <span>
                  AI-generated interface concept
                </span>

              </div>


              <div className="device-switcher">

                <button className="device-active">
                  Desktop
                </button>

                <button>
                  Tablet
                </button>

                <button>
                  Mobile
                </button>

              </div>

            </div>


            {/* Prototype */}

            <div className="prototype-container">

              <PrototypePreview
                title={result.projectName}
                audience={result.audience}
                result={result}
              />

            </div>

{/* AI EDITOR */}

<div className="ai-editor">

  <div className="editor-icon">
    ✦
  </div>

  <input
    value={editPrompt}
    onChange={(e) => setEditPrompt(e.target.value)}
    placeholder="Tell DesignAI what you'd like to change..."
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        handleAIEdit();
      }
    }}
    disabled={false}
  />

  <button
  onClick={handleAIEdit}
>
  {isEditing ? "Editing..." : "Send →"}
</button>

</div>

{editMessage && (
  <div className="ai-edit-message">
    {editMessage}
  </div>
)}

<div className="ai-edit-suggestions">

  <button
    onClick={() =>
      setEditPrompt(
        "Change the color palette to a modern and professional combination."
      )
    }
  >
    🎨 Change Colors
  </button>

  <button
    onClick={() =>
      setEditPrompt(
        "Make the overall design more modern, clean and visually appealing."
      )
    }
  >
    ✨ Make it Modern
  </button>

  <button
    onClick={() =>
      setEditPrompt(
        "Improve the mobile UX and make the interface fully responsive."
      )
    }
  >
    📱 Improve Mobile UX
  </button>

</div>

{/* DESIGN VERSION HISTORY */}

{designHistory.length > 0 && (
  <div className="design-history">

    <div className="history-title">
      <span>↺</span>
      <strong>Design History</strong>
    </div>

    <div className="history-list">

      {designHistory.map((version, index) => (
        <div
          className="history-item"
          key={index}
        >
          <div>
  <strong>
    Version {index + 1}
  </strong>

  <p>
    {version.projectName || "Previous design"}
  </p>
</div>

<button
  className="restore-version"
  onClick={() => {
    setResult(version);
    setEditMessage(`✦ Version ${index + 1} restored`);
  }}
>
  Restore
</button>
        </div>
      ))}

    </div>

  </div>
)}

          </main>

        </div>

      </div>
    );
  }

if (!currentUser) {
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          ✦
        </div>

        <h1>Welcome to DesignAI</h1>

        <p>
          Sign in to start creating intelligent UI/UX designs.
        </p>

        <form onSubmit={handleAuthSubmit}>

          {authMode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={authName}
              onChange={(e) =>
                setAuthName(e.target.value)
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={authEmail}
            onChange={(e) =>
              setAuthEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) =>
              setAuthPassword(e.target.value)
            }
            required
          />

          {authError && (
            <p className="auth-error">
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="auth-primary-button"
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>

        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={authLoading}
        >
          Continue with Google
        </button>

        <p className="auth-switch">
          {authMode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setAuthMode(
                authMode === "login"
                  ? "signup"
                  : "login"
              );

              setAuthError("");
            }}
          >
            {authMode === "login"
              ? " Sign Up"
              : " Sign In"}
          </button>
        </p>

      </div>
    </div>
  );
}

  /* =====================================
     DASHBOARD
  ===================================== */

  return (
    <div className="app">

      {/* Sidebar */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ✦
          </div>

          <div>
            <h2>DesignAI</h2>
            <span>UI/UX Assistant</span>
          </div>

        </div>


        <nav className="sidebar-nav">

          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>✦</span>
            AI Designer
          </button>

          <button className="nav-item">
            <span>◇</span>
            Projects
          </button>

          <button className="nav-item">
            <span>▧</span>
            Templates
          </button>

        </nav>


        <div className="sidebar-bottom">

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>


          <div className="pro-card">

            <span>✦</span>

            <h4>DesignAI Pro</h4>

            <p>
              Unlock advanced AI design features.
            </p>

            <button>
              Explore Pro
            </button>

          </div>


          <div className="user-card">

  <div className="avatar">
    {currentUser?.displayName
      ? currentUser.displayName.charAt(0).toUpperCase()
      : currentUser?.email?.charAt(0).toUpperCase() || "U"}
  </div>

  <div className="user-details">
    <strong>
      {currentUser?.displayName || "User"}
    </strong>

    <span>
      {currentUser?.email || "Free Plan"}
    </span>
  </div>

  <button
    className="logout-button"
    onClick={handleLogout}
  >
    Logout
  </button>

</div>
        </div>

      </aside>


      {/* Main */}

      <main className="main">

        <header className="topbar">

          <div className="mobile-brand">
            ✦ DesignAI
          </div>

          <div className="topbar-right">

            <button className="icon-button">
              🔔
            </button>

            <div className="top-avatar">
              SD
            </div>

          </div>

        </header>


        <section className="dashboard">

          <div className="welcome">

            <div>

              <p className="eyebrow">
                AI-POWERED DESIGN WORKSPACE
              </p>

              <h1>
                Turn your idea into a
                <span> real product.</span>
              </h1>

              <p className="welcome-text">
                Describe your idea and let DesignAI
                transform it into a complete UI/UX
                design blueprint.
              </p>

            </div>

          </div>


          {/* Generator */}

          <section className="generator-card">

            <div className="generator-heading">

              <div className="sparkle">
                ✦
              </div>

              <div>

                <h2>
                  What do you want to design?
                </h2>

                <p>
                  Start with a simple product idea.
                  You can refine it later with AI.
                </p>

              </div>

            </div>


            <textarea
              className="idea-input"
              value={idea}
              onChange={(e) =>
                setIdea(e.target.value)
              }
              placeholder="Example: A modern internship platform where college students can discover internships, apply for opportunities and track their applications..."
            />


            {/* Options */}

            <div className="design-options">

              <div className="option-group">

                <label>Platform</label>

                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value)
                  }
                >
                  <option>
                    Web Application
                  </option>

                  <option>
                    Mobile Application
                  </option>

                  <option>
                    Dashboard
                  </option>

                  <option>
                    Landing Page
                  </option>

                </select>

              </div>


              <div className="option-group">

                <label>Design Style</label>

                <select
                  value={style}
                  onChange={(e) =>
                    setStyle(e.target.value)
                  }
                >
                  <option>
                    Modern Minimal
                  </option>

                  <option>
                    Professional
                  </option>

                  <option>
                    Dark Premium
                  </option>

                  <option>
                    Glassmorphism
                  </option>

                  <option>
                    Colorful
                  </option>

                </select>

              </div>


              <div className="option-group">

                <label>Target Audience</label>

                <select
                  value={audience}
                  onChange={(e) =>
                    setAudience(e.target.value)
                  }
                >
                  <option>Students</option>

                  <option>
                    Professionals
                  </option>

                  <option>
                    Businesses
                  </option>

                  <option>
                    General Users
                  </option>

                </select>

              </div>

            </div>


            {/* Generate */}

            <button
  className="generate-button"
  onClick={handleGenerate}
  disabled={isGenerating}
>
  {isGenerating ? (
    <>
      <span className="loading-spinner"></span>
      DesignAI is thinking...
    </>
  ) : (
    <>
      ✦ Generate Prototype →
    </>
  )}
</button>

          </section>


          {/* Stats */}

          <section className="stats">

            <div className="stat-card">

              <div className="stat-icon purple">
                ✦
              </div>

              <div>
                <span>AI Designs</span>
                <strong>24</strong>
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon blue">
                ◇
              </div>

              <div>
                <span>Projects</span>
                <strong>8</strong>
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>Prototypes</span>
                <strong>16</strong>
              </div>

            </div>

          </section>


          {/* Recent Projects */}

          <section className="projects-section">

            <div className="section-header">

              <div>
                <h2>Recent Projects</h2>

                <p>
                  Continue working on your designs.
                </p>
              </div>

              <button className="view-all">
                View all →
              </button>

            </div>


            <div className="project-grid">

              <ProjectCard
                title="CareerTrack"
                type="Web Application"
                date="Today"
                color="purple"
              />

              <ProjectCard
                title="Foodly"
                type="Mobile Application"
                date="Yesterday"
                color="orange"
              />

              <ProjectCard
                title="TravelAI"
                type="Web Application"
                date="2 days ago"
                color="blue"
              />

            </div>

          </section>

        </section>

      </main>

    </div>
  );
}


/* =====================================
   PROTOTYPE PREVIEW
===================================== */

function PrototypePreview({
  title,
  audience,
  result
}) {
  return (
    <div className="generated-prototype">

      {/* Navbar */}

      <div className="prototype-nav">

        <div className="prototype-logo">
          ✦ {title}
        </div>

        <div className="prototype-links">

          <span>Home</span>
          <span>Explore</span>
          <span>Applications</span>
          <span>Profile</span>

        </div>

        <div className="prototype-profile">
          👤
        </div>

      </div>


      {/* Hero */}

      <div className="prototype-hero">

        <div>

          <span className="prototype-badge">
            ✦ Designed for {audience}
          </span>

          <h1>
  {result?.projectName || "Your AI-powered product"}
</h1>

         <p>
  {result?.summary ||
    "A smart digital experience designed around your users and goals."}
</p>


          <div className="prototype-search">

            <span>⌕</span>

            <span className="search-placeholder">
  {result?.features?.[0]
    ? `Explore ${result.features[0]}...`
    : "Search and explore..."}
</span>

            <button>
              Search
            </button>

          </div>

        </div>

      </div>


      {/* Cards */}

      <div className="prototype-section">

        <div className="prototype-section-title">

          <div>
            <h2>
  {title} Features
</h2>

            <p>
  AI-generated features designed
  for your target users.
</p>
          </div>

          <span>
            View all →
          </span>

        </div>


        <div className="opportunity-grid">

  {result?.features?.slice(0, 3).map((feature, index) => (
    <OpportunityCard
      key={index}
      company={title}
      role={feature}
      location={audience}
    />
  ))}

</div>

      </div>

    </div>
  );
}


/* Opportunity Card */

function OpportunityCard({
  company,
  role,
  location
}) {
  return (
    <div className="opportunity-card">

      <div className="company-icon">
        ✦
      </div>

      <span className="internship-label">
        INTERNSHIP
      </span>

      <h3>{role}</h3>

      <p>{company}</p>

      <div className="opportunity-footer">

        <span>⌖ {location}</span>

        <button>
          View
        </button>

      </div>

    </div>
  );
}


/* Project Card */

function ProjectCard({
  title,
  type,
  date,
  color
}) {
  return (
    <div className="project-card">

      <div
        className={`project-preview ${color}`}
      >

        <div className="preview-navbar"></div>

        <div className="preview-content">

          <div className="preview-line large"></div>

          <div className="preview-line"></div>

          <div className="preview-boxes">

            <div></div>
            <div></div>
            <div></div>

          </div>

        </div>

      </div>


      <div className="project-info">

        <div>

          <h3>{title}</h3>

          <p>{type}</p>

        </div>

        <span>{date}</span>

      </div>

    </div>
  );
}


export default App;