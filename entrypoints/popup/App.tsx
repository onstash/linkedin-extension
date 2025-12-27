import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./App.css";
import { DegreeHighlighter } from "./DegreeHighlighter";
import { TrackProfile } from "./TrackProfile";

export function App() {
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
