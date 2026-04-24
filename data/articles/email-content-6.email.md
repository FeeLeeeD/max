# Max - Support Email Content (Part 6 of 6 — Threads 31-44)

Continuation of "Max - Support Email Content". See Part 1 for the anonymization key and Threads 1-15.

---

## Thread 31: Korn Ferry Marketo Campaign Queue Affecting Send (Zendesk Ticket [id_redacted])

**Date:** 2025-11-20
**Subject:** Marketo Campaign Queue Affecting 7th Sense Send

### Initial ticket from [Person_M]

[Company_I]'s Marketo Campaign Queue was affecting a Seventh Sense send. Couldn't find any results in the Trigger campaign Results tab.

### Resolution path

Mike scheduled a quick 15-min call (squeezing into [Person_M]'s schedule before another meeting at 3:45pm). After the call, [Person_M] received a Marketo system failure notification: **"Flow step 1 choice 1 has an error. Only this flow step was skipped."**

### Key insight for MAX

Marketo Campaign Queue issues can affect Seventh Sense sends. Specific error: "Flow step 1 choice 1 has an error. Only this flow step was skipped" — Marketo-side problem in the campaign flow definition, not Seventh Sense.

---

## Thread 32: Same Korn Ferry assignment notification (admin-only, Zendesk routing)

**Date:** 2025-11-20
**Subject:** Marketo Campaign Queue Affecting 7th Sense Send (initial assignment)

### Summary

Internal Zendesk routing notification — same ticket as Thread 31. Mike's initial reply: "We will look into this asap and get a comprehensive answer back to you." Then 40 min later: "We're still looking into this, but as of right now, we don't see any issues. Are you still in a state where zero emails have been sent for the campaign?" — leading into the call escalation in Thread 31.

---

## Thread 33: Analytics question follow-up (Zendesk Ticket [id_redacted])

**Date:** 2025-11-19
**Subject:** Re: analytics question

### Summary

Follow-up to Thread 34. [Person_GG] said: "Got it, thank you!" Mike replied: "I'm pretty confident it will resolve itself, but if it doesn't, HubSpot's support would be the best way to go. Sorry we can't give you a definitive answer."

---

## Thread 34: Analytics question — initial assignment (Zendesk Ticket [id_redacted])

**Date:** 2025-11-19
**Subject:** Analytics question

### Issue

[Person_GG] (new to Seventh Sense) had an analytics question. Mike redirected: "I hate to pass the puck here, but that would definitely fall under something going on with HubSpot and would need to be addressed with their support. If you're sitting there refreshing in [HubSpot]..."

### Key insight for MAX

Analytics questions tied to HubSpot data refresh delays should be redirected to HubSpot Support. Mike's standard pattern: explain why it's a HubSpot issue, suggest they wait for it to resolve itself, fall back to HubSpot Support if not.

---

## Thread 35: Question on recycling — % vs "no probability of engaging" — Knowfully

**Date:** 2025-11-19
**Subject:** Question on recycling

### Question from [Person_HH] at [Company_S]

"I had a question on the % recycling (ex: 1% or 2%) vs the 'no probability of engaging' — would the 'no probability' one include more people in the sends vs the numerical %?"

### Mike's response

"Good question which made me think that option can be confusing and that we should probably remove it. The option to select 'no probability of engaging' lets everyone through to the send..." (i.e., it lets through everyone, not filtering anyone out — opposite of restrictive percentage thresholds).

### Key insight for MAX

- "No probability of engaging" recycling option = lets EVERYONE through to the send (effectively no filter).
- Mike acknowledges this option name is confusing and may be removed.
- This is the foundational rule for recycling: numerical % is restrictive (only sends to that small slice), while "no probability" is unrestricted (sends to everyone the recycle would otherwise filter).

---

## Thread 36: AbbVie — uptick in delivery failures + delayed pause issues

**Date:** 2025-11-19
**Subject:** Uptick in Delivery Failures & Delayed Pause Issues

### Initial AbbVie response (from [Person_I])

[Person_I] confirmed AbbVie was aware of an issue and had raised a ticket with Marketo: "It appears there are API-related problems with Adobe Engage..."

### Mike's response

Asked [Person_J] (also at AbbVie) for the link to the job she was trying to pause. "It shouldn't take an hour to pause a job. I also just tested this and it was more or less instant. It's quite possible that..." (the pause request was queued behind the Marketo API issue).

### [Person_J]'s follow-up

Sent the job link [`https://app.theseventhsense.com/v2/account/47535/jobs/3555031/cohort/`] noting it's a re-created job.

### Mike's resolution

"Thanks for the added detail and yes, that's likely what happened. Given the job has been recreated, there's not much we can look into."

### Key insight for MAX

- "Delayed pause" issue at AbbVie was caused by Adobe Engage API problems queueing the pause request
- When customer recreates the affected job, debugging visibility is lost (no further investigation possible)
- Mike's diagnostic approach: validate that pause is normally instant (test it himself), then identify the upstream cause (Marketo API congestion)

---

## Thread 37: Monoline training follow-up

**Date:** 2025-11-18
**Subject:** Seventh Sense & Monoline → Training Follow Up

### Summary

Standard post-training follow-up to [Person_GG] at [Company_T]. Includes a recording link and passcode (different format from his typical notetaker link — likely a Zoom recording).

---

## Thread 38: Korn Ferry training follow-up + operational filtering + capacity increase

**Date:** 2025-11-18 to 2025-11-20
**Subject:** Seventh Sense & Korn Ferry → Training Follow Up

### Summary

Post-training follow-up to a 4-person [Company_I] team. [Person_M] replied: they don't currently have a separate email address for operational emails, but they may need one. Mike acknowledged: "Ideally we'd have the ability to filter operational/non-operational. Our team is going to take a look and I'll get back to you. Might be a bit."

### Capacity increase update

Mike followed up two days later: "The temporary capacity increase has greatly sped things up. Approximately 5 months left to go and I anticipate this should be 100% complete by the end of the weekend, if not sooner. Once it..."

### Key insights for MAX

- Customer ask: ability to filter operational vs. non-operational emails — being looked at by Seventh Sense team
- Pattern: temporary capacity increases are deployed for large [Company_I]-class accounts to accelerate processing
- Backlog timing: 5 months remaining → ~weekend completion (showing the speed of capacity-increase impact)

---

## Thread 39: Greenpeace training follow-up

**Date:** 2025-11-18
**Subject:** Seventh Sense & Greenpeace → Training Follow Up

### Summary

Post-training follow-up to [Person_II] at [Company_U]. Mike notes: "Thank you for arranging the training session and also being in the driver's seat. I know that's never easy. I wasn't sure which team members the below should be dispersed too..."

### Key insight for MAX

Mike's training follow-ups acknowledge when the customer-side organizer was "in the driver's seat" running training to their team — recognizing the effort.

---

## Thread 40: Account Disabled #37551 (Zendesk Ticket [id_redacted])

**Date:** 2025-11-13
**Subject:** Account Disabled #37551

### Issue from [Person_JJ]

While logging in, account showed disabled.

### Mike's response

"I'll shoot you a more detailed note in our other thread and close this out. Appreciate you opening a ticket though as that's the best path to speedy resolutions. You should now have..." [account access restored].

### Key insight for MAX

Standard ack: opening a Zendesk ticket is the fastest path to resolution. Account-disabled issues are typically resolved by Mike re-enabling on the back end.

---

## Thread 41: WGU legal team feedback — DPA, redlines, MSA process

**Date:** 2025-11-11 to 2025-11-12
**Subject:** SeventhSense — WGU Feedback from Legal Team

### Summary

[Person_KK] at [Company_J] sent attached redlines from their legal team. Mike forwarded to his external legal counsel ([Person_LL] at [Company_V]) with: "Can you take a look at the attached and put in any comments you have? I reviewed this briefly and I didn't find anything that was of major concern to me."

### Mike's reply to [Company_J]

"Greatly appreciate the follow up and you sending this over. Our legal counsel will review and we should be able to get comments..." Then [Person_KK] noted she'd also check with legal regarding the DPA.

### Mike's resolution

"Appreciate your help in continuing to manage the process. I've attached our responses to the redlines, but all looks good. I'll wait to hear back on the DPA..."

### Key insights for MAX

- Mike uses external legal counsel ([Company_V]) to review enterprise customer redlines
- Pattern: customer's legal team sends redlines → Mike's review (often "nothing major") → external counsel's review and comments → response sent → wait on DPA separately
- DPA (Data Processing Agreement) is often handled as a separate workstream from the MSA

---

## Thread 42: GE Vernova training follow-up scheduling

**Date:** 2025-11-05
**Subject:** Re: Seventh Sense & GE Vernova → Training Follow Up

### Summary

[Person_MM] at [Company_W] confirmed availability for next Thursday at 3:15 PM ET. Mike thanked her and confirmed.

---

## Thread 43: GE Vernova — Mopsapalooza + recycle threshold conversation

**Date:** 2025-09-11 to 2025-11-03
**Subject:** Re: Seventh Sense & GE Vernova → Training Follow Up

### Summary

Long-running thread with [Person_MM], [Person_NN], [Person_OO] at [Company_W]. Initial scheduling exchange (3pm ET on a Tuesday in September). Mike asked: "Are you (or anyone from the team) going to Mopsapalooza this year?" — they had no plans. After a long gap, Mike re-engaged in November: "Hope you had a nice weekend! How's things? It would be great to catch up to review some new capabilities of the system and also continue the conversation about recycle..."

### Key insights for MAX

- **Mopsapalooza** is an industry conference Mike uses for relationship-building/networking with customers
- Standard re-engagement message after a long silence: ask how things are, frame the meeting as new capabilities + continuation of the recycle conversation

---

## Thread 44: Knowfully — workflow question (contact got Oct 31 email before Oct 30)

**Date:** 2025-10-30
**Subject:** Seventh Sense Workflow Question/Error

### Issue from [Person_HH] at [Company_S]

Two workflows turned on with emails going out Oct 30 at midnight for a 15-hour send, then Oct 31 follow-up. One contact was sent the Oct 31 email first.

### Mike's response

"That's definitely strange. It has to be something in the way the workflow logic is set up. Do you have 15 minutes to jump on a Zoom to show me?" Scheduled call for 12:30 PM ET. [Person_HH] also said she'd loop in their HubSpot rep / Delmar to investigate.

### Call interruption

[Person_HH]: "Looks like my Internet just went out. I'm going to try to reconnect, if not, let's get something — for later."

### Key insight for MAX

Out-of-order email sending in workflows = a workflow logic configuration issue, not a Seventh Sense scheduling bug. Mike's diagnostic approach: jump on a quick Zoom to see the workflow, loop in HubSpot rep if needed.

---
