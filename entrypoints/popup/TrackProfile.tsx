import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, UserPlus } from "lucide-react";
import { TrackActionType, useExtensionStore } from "@/lib/store";

const trackProfileButtonWithActions: Array<{
  actionType: TrackActionType;
  label: string;
}> = [
  {
    actionType: "add_connection",
    label: "Track (Add Connection)",
  },
  {
    actionType: "dtm",
    label: "Track (DTM)",
  },
  {
    actionType: "birthday",
    label: "Track (Birthday)",
  },
  {
    actionType: "work_anniversary",
    label: "Track (Work Anniversary)",
  },
  {
    actionType: "start_conversation",
    label: "Track (Start Conversation)",
  },
];

export function TrackProfile() {
  const { trackProfileError, trackProfile } = useExtensionStore();

  return (
    <Card className="w-[300px] border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          <UserPlus className="h-4 w-4 text-orange-500" />
          Track Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackProfileButtonWithActions.map((button) => (
          <Button
            onClick={() => trackProfile(button.actionType)}
            variant="default"
            className="w-full"
            size="lg"
          >
            {button.label}
          </Button>
        ))}

        {trackProfileError && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}

        {trackProfileError && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {trackProfileError.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
