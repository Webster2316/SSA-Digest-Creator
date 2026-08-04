import { useState } from "react";
import { CalendarDays, GraduationCap } from "lucide-react";
import WeeklyDigestBuilder from "./builders/WeeklyDigestBuilder";
import TrainingBulletinBuilder from "./builders/TrainingBulletinBuilder";

type BuilderKey = "weeklyDigest" | "trainingBulletin";

const builders: { key: BuilderKey; label: string; icon: any }[] = [
  { key: "weeklyDigest", label: "Weekly Digest", icon: CalendarDays },
  { key: "trainingBulletin", label: "Training Bulletin", icon: GraduationCap },
];

export default function App() {
  const [builder, setBuilder] = useState<BuilderKey>("weeklyDigest");

  return (
    <div className="min-h-screen bg-gray-100 flex  gap-2">
 <div className="w-52 shrink-0 hidden md:block pt-4 pb-4 pl-4 pr-0">
    <div className="space-y-1">
      {builders.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setBuilder(key)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-left ${
            builder === key
              ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  </div>

      <div className="flex-1">
        {builder === "weeklyDigest" && <WeeklyDigestBuilder />}
        {builder === "trainingBulletin" && <TrainingBulletinBuilder />}
      </div>
    </div>
  );
}