import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, UserPlus } from "lucide-react";
import { useExtensionStore } from "@/lib/store";

export function TrackProfile() {
  const { trackError, trackProfile } = useExtensionStore();

  return (
    <Card className="w-[300px] border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          <UserPlus className="h-4 w-4 text-orange-500" />
          Track Profile
        </CardTitle>
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

        <Button
          onClick={() => trackProfile("birthday")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (Birthday)
        </Button>

        <Button
          onClick={() => trackProfile("work_anniversary")}
          variant="default"
          className="w-full"
          size="lg"
        >
          Track Profile (Work Anniversary)
        </Button>

        {trackError && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}

        {trackError && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {trackError.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
