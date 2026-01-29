import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useExtensionStore } from "@/lib/store";

export function DegreeHighlighter() {
  const {
    isHighlighting,
    highlightStatus,
    highlightError,
    checkHighlightStatus,
    toggleHighlightingV2,
  } = useExtensionStore();

  // Check status on mount
  useEffect(() => {
    checkHighlightStatus();
  }, []);

  return (
    <Card className="w-[300px] border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          <Sparkles className="h-4 w-4 text-purple-500" />
          1st & 2nd Degree Connection Highlighter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleHighlightingV2}
          variant={isHighlighting ? "destructive" : "default"}
          className="w-full"
          size="lg"
        >
          {isHighlighting ? (
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
          {highlightError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span
            className={
              highlightError ? "text-destructive" : "text-muted-foreground"
            }
          >
            {highlightStatus}
          </span>
        </div>

        {highlightError && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {highlightError.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
