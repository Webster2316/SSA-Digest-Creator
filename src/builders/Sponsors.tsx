import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, Save, Download, ImagePlus,  X,} from "lucide-react";
import MoveButtons from "../shared/moveButtons";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import RichTextEditor from "../shared/richTextEditor"; 

const packageTable:  Record<string, { text: string; bg: string; color: string; border: string }> = {
  // confirmed: { text: "Confirmed", bg: "#eaf4fb", color: "#1b76bc", border: "#b8dcf2" },
  // limited: { text: "Limited Seats", bg: "#fff3f3", color: "#993c1d", border: "#f0997b" },
  // waitlist: { text: "Waitlist", bg: "#fff8e6", color: "#8a6d1d", border: "#eecf7a" },
  // cancelled: { text: "Cancelled", bg: "#fbeaea", color: "#a12a2a", border: "#eeb4b4" },
  // open: {text: "open", bg: "#bee8cc", color: "#358c32", border: "#1f821b"},
  // highDemand: {text: "High Demand", bg: "#fbeaea", color: "#a12a2a", border: "#eeb4b4"},
}

interface  makeSponsorItem {
    id: string;
    header: string;
    salutations:string;
    package: packageTable;
    opening: string;
    closing: string;
}
//for internal use mainly 
export default function Sponsors() {
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");

    const getDateTime = () =>
    new Date().toLocaleString("en-SG", {
      dateStyle: "short",
      timeStyle: "short",
    });

    return(
        <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-4xl p-4">
        <div className="mb-4 flex items-center gap-3">
        <img
          src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
          alt="SSA Logo"
          className="h-8 w-auto"
        />

        <h1 className="text-xl font-bold text-indigo-900">
        Sponsor Email Builder
        </h1>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          {saveStatus === "saving" && (
            <>
              <Loader2 size={13} className="animate-spin" />
              Saving…
            </>
          )}

          {saveStatus.startsWith("Saved at") && (
            <>
              <Save size={13} />
              {saveStatus}
            </>
          )}

          {saveStatus === "too-large" && (
            <span className="text-red-600">
              Too large to save. Remove some images.
            </span>
          )}

          {saveStatus.startsWith("error") && (
            <span className="text-red-600">
              Save failed
              {saveStatus.includes(":") ? ` (${saveStatus.split(":")[1]})` : ""}
            </span>
          )}
        </div>
        </div>
        </div>
      </div>

    )
}