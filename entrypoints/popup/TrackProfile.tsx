import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function TrackProfile() {
  const [status, setStatus] = useState<string>("Ready");
  const [error, setError] = useState<Error | null>(null);

  const handleClick = async (actionType: "new_connection" | "dtm") => {
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
      const action = `track_profile_${actionType}`;
      const response = (await browser.tabs.sendMessage(tab.id, { action })) as {
        success: boolean;
        data:
          | {
              success: true;
              data: {
                fullName: string;
                profileLink: string;
              };
            }
          | {
              success: false;
              issues: {
                message: string;
              }[];
            };
      };

      if (response?.success) {
        if (response?.data?.success) {
          setStatus(`Profile tracked successfully - ${actionType}`);
          window.open(
            `https://app.youform.com/forms/u5msmgsv?fullname=${response?.data?.data?.fullName}&profilelink=${response?.data?.data?.profileLink}&action=${actionType === "new_connection" ? "Add%20connection" : "DTM"}`,
            "_blank"
          );
        } else {
          setStatus(`Profile tracked successfully - ${actionType}`);
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
          Track Profile: new connections, DTM, etc
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={(e) => handleClick("new_connection")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (new connection)
        </Button>

        <Button
          onClick={(e) => handleClick("dtm")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (DTM)
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
