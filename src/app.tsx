import { useState } from "react";
import WeeklyDigestBuilder from "./builders/WeeklyDigestBuilder";

type BuilderKey = "WeeklyDigest"; // add "training" | "otherOrg" as you build them

export default function App() {
  const [builder, setBuilder] = useState<BuilderKey>("WeeklyDigest");

  return (
    <div>
      {/* toggle nav goes here once you have more than one builder */}
      {builder === "WeeklyDigest" && <WeeklyDigestBuilder />}
    </div>
  );
}