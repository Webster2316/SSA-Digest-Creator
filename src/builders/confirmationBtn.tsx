import {useState, useEffect} from "react";
import {Plus, Trash2, Save, Loader2 } from "lucide-react"
import NamePopUp from "../shared/NamePopUpModal";
import useConfirmDelete from "../shared/useConfirmDelete";


interface Buttons {
  id: string,
  title: string,
}

function viewData() {

}

function getTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function buildBtns(event: Buttons) {
return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0"
width="100%" style="max-width:480px; border:1px solid #ddd9e8;
background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
<tr>
<td style="padding:24px;">

<h2 style="margin:0 0 8px; color:#241e42; font-size:20px;
          line-height:28px;">
Confirmation for ${event.title} Event
</h2>

<p style="margin:0 0 22px; color:#666; font-size:13px;
         line-height:19px;">
 RSVP below. Your response will be recorded.
</p>


<table
role="presentation"
cellpadding="0"
cellspacing="0"
border="0"
style="margin: 16px auto;"
>
<tr>

<td align="center" style="padding: 0 6px;">
<a
 href="https://ssa-weekly-digest-creator.vercel.app/api/surveys?surveyId=${event.id}&amp;answer=Yes"
 style="
   display: inline-block;
   background-color: #167D66;
   color: #ffffff;
   font-family: Arial, sans-serif;
   font-size: 14px;
   font-weight: bold;
   text-decoration: none;
   padding: 12px 28px;
   border-radius: 6px;
   text-align: center;
 "
>
 Yes, I will be attending
</a>
</td>


<td align="center" style="padding: 0 6px;">
<a
 href="https://ssa-weekly-digest-creator.vercel.app/api/surveys?surveyId=${event.id}&amp;answer=No"
 style="
   display: inline-block;
   background-color: #C34D4D;
   color: #ffffff;
   font-family: Arial, sans-serif;
   font-size: 14px;
   font-weight: bold;
   text-decoration: none;
   padding: 12px 28px;
   border-radius: 6px;
   text-align: center;
 "
>
 No, I will not be attending
</a>
</td>
</tr>
</table>

<p style="margin:20px 0 0; color:#777; font-size:12px;
         line-height:18px;">
You will be redirected upon selecting. (Do note that it is a one time click. Please email  to change you confirmation status)
</p>
</td>
</tr>
</table>
`
}
function SaveIndicator({ status }: { status: string }) {
  if (status === "saving") {
    return (
      <>
        <Loader2 size={13} className="animate-spin" /> Saving…
      </>
    );
  }
  if (status.startsWith("Saved at")) {
    return (
      <>
        <Save size={13} /> {status}
      </>
    );
  }
  if (status === "error") return <span className="text-red-600">Save failed</span>;
  return null;
}
function ItemRow({
  button,
  onGetCode,
  onDelete,
}: {
  button: Buttons;
  onGetCode: (button: Buttons) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-800">
        {button.title || "Untitled Event"}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onGetCode(button)}
          className="px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 rounded-md"
        >
          Copy HTML
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete event"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function confirmationBtns() {
const [btn, setBtn] = useState<Buttons[]>([]);
const [loaded, setLoaded] = useState(false);
const [loadFailed, setLoadFailed] = useState(false);
const [saveStatus, setSaveStatus] = useState("idle");
const [isNameModalOpen, setIsNameModalOpen] = useState(false);
const [buttonHtml, setButtonHtml] = useState("");
const [generating, setGenerating] = useState(false);
const { confirmDelete, deleteModal } = useConfirmDelete();

const handleGetCode = async (button: Buttons) => {
  const html = buildBtns(button);

  try {
    await navigator.clipboard.writeText(html);
    alert("HTML copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy HTML:", error);
    alert("Unable to copy HTML. Please try again.");
  }
};
/* ---------------- load ---------------- */
useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const res = await fetch(
        `/api/load-digest?key=button-generator`
      );

      if (!res.ok) {
        throw new Error("Failed to load button generator");
      }

      const data = await res.json();

      if (cancelled) return;

      // Adjust this line if your API returns a different shape.
      const savedButtons = data.value?.btn ?? data.btn ?? [];

      setBtn(Array.isArray(savedButtons) ? savedButtons : []);
    } catch (error) {
      console.error("Failed to load button generator:", error);
    } finally {
      if (!cancelled) {
        setLoaded(true);
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, []);

/* ---------------- autosave ---------------- */
useEffect(() => {
  if (!loaded) return;

  setSaveStatus("saving");

  const timer = setTimeout(async () => {
    try {
      const res = await fetch(
        `/api/save-digest?key=button-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ btn }),
        }
      );

      setSaveStatus(
        res.ok ? `Saved at ${getTimeLabel()}` : "error"
      );
    } catch (error) {
      console.error("Failed to save button generator:", error);
      setSaveStatus("error");
    }
  }, 700);

  return () => clearTimeout(timer);
}, [loaded, btn]);


const addBtn = async (title: string) => {
  setGenerating(true);

  try {
    // 1. Create survey in Neon
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create survey");
    }

    // 2. Build button configuration using the real database ID
    const newBtn: Buttons = {
      id: String(data.surveyId),
      title: title.trim(),
    };

    setBtn((prev) => [...prev, newBtn]);

  
    setButtonHtml(buildBtns(newBtn));


    setIsNameModalOpen(false);
  } catch (error) {
    console.error("Failed to generate buttons:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Failed to generate buttons"
    );
  } finally {
    setGenerating(false);
  }
};

const deleteBtn = (button: string) => {
confirmDelete({
  itemType:"button",
  itemName: button.title,
  action: () => setEvents((prev) => prev.filter((item) => item.id !== button.id)),
})
}

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-4">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-indigo-900">Button generator</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        {btn.map((button) => (
  <ItemRow
    key={button.id}
    button={button}
    onGetCode={handleGetCode}
    onDelete={() => deleteBtn(ev)}
  />
))}
        <button
                  type="button"
                  onClick={() => setIsNameModalOpen(true)}
                  className="mt-3 flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                >
                  <Plus size={16} /> Create Confirmation Btn
                </button>
                <NamePopUp
                  isOpen={isNameModalOpen}
                  onClose={() => setIsNameModalOpen(false)}
                  onAdd={addBtn}
                  heading="Create New Confirmation Button"
                  fieldLabel="Event Name"
                  placeholder="e.g Ai Seminar"
                  buttonText="generate Button"
                />

      </div>
   </div>


  )
}