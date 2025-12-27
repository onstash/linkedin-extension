import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useExtensionStore } from "@/lib/store";

export function TrackProfile() {
  const { trackStatus, trackError, trackProfile } = useExtensionStore();

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
          onClick={() => trackProfile("new_connection")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (new connection)
        </Button>

        <Button
          onClick={() => trackProfile("dtm")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (DTM)
        </Button>

        <div className="flex items-center gap-2 text-sm">
          {trackError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span
            className={
              trackError ? "text-destructive" : "text-muted-foreground"
            }
          >
            {trackStatus}
          </span>
        </div>

        {trackError && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {trackError.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
