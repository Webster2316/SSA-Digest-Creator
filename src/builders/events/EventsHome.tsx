import { useState, useEffect } from "react";
import { Trash2, SquareArrowOutUpRight, ChevronDown, ChevronUp} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

//FUNCTIONS//
function makeEventItem(overrides = {}) {
return Object.assign(
    { id: uid(), header: "", status: "onGoing"},
overrides
)
}
const statusOptions: Record<string, { text: string; bg: string; color: string; border: string }> = {
    completed: { text: "Completed", bg: "#4ab065", color: "#007d21", border: "#007d21" },
    onGoing: { text: "On Going", bg: "#c7b267", color: "#bf9708", border: "#bf9708" },
  };
export default function EventsHome() {
    const [events, setEvents] = useState(makeEventItem);
return(
    <div>
    <div className="flex items-center gap-3">
    <img
      src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
      alt="SSA Logo"
      className="h-8 w-auto"
    />
    <h1 className="text-xl font-bold text-indigo-900">
      Upcoming Events
    </h1>
  </div>
{/* //if events.length == 0  */}
<div>

<button
                onClick={() =>
                  setEvents([
                    ...events,
                    {
                        id: uid(), 
                        header: "", 
                        status: "onGoing"
                    },
                  ])
                }
                className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
              >
                <Plus size={16} /> Add Event
              </button>
</div>
</div>
);
}