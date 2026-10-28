import {useState, useEffect} from "react";
import {Plus, Trash2, Save, Loader2 } from "lucide-react"

interface Buttons {
  id: string,
  title: string,
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
export default function confirmationBtns() {
const [btn, setBtn] = useState<Buttons[]>([]);
const [loaded, setLoaded] = useState(false);
const [loadFailed, setLoadFailed] = useState(false);


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


const addBtn = (title: string) => {
setBtn((prev) => [...prev, title])
};
const deleteBtns = (event: Buttons) =>
confirmDelete({
  itemName: event.title,
  action: () => setEvents((prev) => prev.filter((item) => item.id !== event.id)),
});
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
      </div>
   </div>


  )
}