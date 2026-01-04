import { useEffect, useState } from "react";
import "./App.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DegreeHighlighter } from "./DegreeHighlighter";
import { TrackProfile } from "./TrackProfile";
import { TrackBookmarks2Action } from "./Bookmarks2Action";

export function App() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      setCurrentUrl(tabs[0]?.url ?? "");
    });
  }, []);

  // Loading state while fetching URL
  if (currentUrl === null) {
    return <p className="p-4 text-muted-foreground">Loading...</p>;
  }
  const isLinkedIn = currentUrl.includes("linkedin.com");
  if (isLinkedIn) {
    return (
      <Card className="w-[300px] border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            LinkedIn++
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DegreeHighlighter />
          <TrackProfile />
        </CardContent>
      </Card>
    );
  }
  const isInstagram = currentUrl.includes("instagram.com");
  const isTwitter =
    currentUrl.includes("twitter.com") || currentUrl.includes("x.com");

  if (!isInstagram && !isTwitter) {
    return (
      <p className="p-4 text-muted-foreground">
        Please navigate to LinkedIn, Instagram, or Twitter to use this
        extension.
      </p>
    );
  }

  return (
    <Card className="w-[300px] border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Instagram++ & Twitter++
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TrackBookmarks2Action />
      </CardContent>
    </Card>
  );
}
