import { useState } from "react";
import { CalendarDays, GraduationCap, BotMessageSquare, Martini, Settings, MessageSquareQuote, UserStar } from "lucide-react";
import WeeklyDigestBuilder from "./builders/WeeklyDigestBuilder";
import TrainingBulletinBuilder from "./builders/TrainingBulletinBuilder";
import AIBulletinBuilder from "./builders/AIBulletinBuilder";
import EventsBuilder from "./builders/events/EventsHome";
import DataManagement from "./archiveSettings/index";
import Socials from "./builders/postBuilder";
import AdminBrief from "./builders/AdminBrief"
;
type BuilderKey = "weeklyDigest" | "trainingBulletin" | "AIBulletin" | "events" | "dataManagement" | "postBuilder" | "adminBrief";
const builders: { key: BuilderKey; label: string; icon: any }[] = [
  { key: "weeklyDigest", label: "Weekly Digest", icon: CalendarDays },
  { key: "trainingBulletin", label: "Training Calendar", icon: GraduationCap },
  { key: "AIBulletin", label: "AI Bulletin", icon: BotMessageSquare },
  { key: "events", label: "Events", icon: Martini},
  {key: "postBuilder", label: "Socials", icon: MessageSquareQuote},
  {key: "adminBrief", label: "Admin Brief", icon: UserStar},
];

//social media - 1 - partially complete 
// survey - outlook polls
//admin brief 
// sponsorship template ??? -TE
export default function App() {
  const [builder, setBuilder] = useState<BuilderKey>("weeklyDigest");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile: horizontal tab bar */}
      <div className="flex md:hidden border-b border-gray-200 bg-white px-2 overflow-x-auto">
        {builders.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setBuilder(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
              builder === key
                ? "border-indigo-700 text-indigo-800"
                : "border-transparent text-gray-500"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
  
        {/* Data Management on mobile */}
        <button
          type="button"
          onClick={() => setBuilder("dataManagement")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
            builder === "dataManagement"
              ? "border-indigo-700 text-indigo-800"
              : "border-transparent text-gray-500"
          }`}
        >
          <Settings size={15} />
         Settings
        </button>
      </div>
  
      {/* Desktop: sidebar */}
      <div className="w-52 shrink-0 hidden md:flex flex-col h-screen sticky top-0 self-start pt-4 pb-4 pl-4">
        {/* Builders at top */}
        <div className="space-y-1">
          {builders.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
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
  
        {/* Data Management pinned to bottom */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={() => setBuilder("dataManagement")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-left ${
              builder === "dataManagement"
                ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Settings size={15} />
           Settings
          </button>
        </div>
      </div>
   
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {builder === "weeklyDigest" && <WeeklyDigestBuilder />}
        {builder === "trainingBulletin" && <TrainingBulletinBuilder />}
        {builder === "AIBulletin" && <AIBulletinBuilder />}
        {builder === "events" && <EventsBuilder />}
        {builder === "dataManagement" && <DataManagement />}
        {builder === "postBuilder" && <Socials />} 
        {builder === "adminBrief" && <AdminBrief />}
      </div>
    </div>
  );
}
