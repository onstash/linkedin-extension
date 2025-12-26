import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Square, AlertCircle, CheckCircle2 } from "lucide-react";

export function DegreeHighlighter() {
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

        const response = await browser.tabs.sendMessage(tab.id!, {
          action: "degree_highlight_status",
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
      const action = isActive
        ? "degree_highlight_stop"
        : "degree_highlight_start";
      const response = await browser.tabs.sendMessage(tab.id, { action });

      if (response?.success) {
        setIsActive(!isActive);
        if (action === "degree_highlight_start") {
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
    <Card className="w-[300px] border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          LinkedIn++
        </CardTitle>
        <CardDescription>
          1st & 2nd Degree Connection Highlighter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleToggle}
          variant={isActive ? "destructive" : "default"}
          className="w-full"
          size="lg"
        >
          {isActive ? (
            <>
              <Square className="mr-2 h-4 w-4" /> Stop Highlighting
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Start Highlighting
            </>
          )}
        </Button>

        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span
            className={error ? "text-destructive" : "text-muted-foreground"}
          >
            {status}
          </span>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
