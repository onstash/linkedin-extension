import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [error, setError] = useState<Error | null>(null);

  // Check if we're on LinkedIn and get current status
  useEffect(() => {
    async function checkStatus() {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        console.log("useEffect -> checkStatus -> tab", tab);

        const response = await browser.tabs.sendMessage(tab.id!, {
          action: "status",
        });
        setIsActive(response?.isActive ?? false);
        setStatus(response?.isActive ? "Highlighting active" : "Ready");
      } catch {
        setStatus("Ready");
      }
    }

    checkStatus();
  }, []);

  const handleToggle = async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        setStatus("No active tab found");
        return;
      }

      setError(null);
      const action = isActive ? "stop" : "start";
      const response = await browser.tabs.sendMessage(tab.id, { action });

      if (response?.success) {
        setIsActive(!isActive);
        if (action === "start") {
          setStatus(`Highlighted ${response.count} connections`);
        } else {
          setStatus(`Cleaned up ${response.cleaned} highlights`);
        }
      } else {
        setStatus("Error communicating with page");
        setError(new Error("Error communicating with page"));
      }
    } catch (err: unknown) {
      const _error = err as Error;
      console.error("Error:", _error);
      setStatus("Error communicating with page");
      setError(_error);
    }
  };

  return (
    <div className="container">
      <h1>LinkedIn++</h1>
      <p className="subtitle">1st & 2nd Degree Connection Highlighter</p>

      <button
        onClick={handleToggle}
        className={`toggle-button ${isActive ? "active" : ""}`}
      >
        {isActive ? "Stop Highlighting" : "Start Highlighting"}
      </button>

      <p className="status">{status}</p>
      {error && <p className="error">{error.name}</p>}
      {error && <p className="error">{error.message}</p>}
      {error && <p className="error">{error.stack}</p>}
    </div>
  );
}

export default App;
