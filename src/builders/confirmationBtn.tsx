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
 href="https://ssa-weekly-digest-creator.vercel.app/api/surveys?surveyId=1&amp;answer=Yes"
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
 href="https://ssa-weekly-digest-creator.vercel.app/api/surveys?surveyId=1&amp;answer=No"
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

export default function confirmationBtns() {
const [btn, setBtn] = useState<Buttons>([]);

  return (
    <div>
    

    </div>
  )
}