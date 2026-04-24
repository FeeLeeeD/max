# Max - Support Email Content (Part 4 of 6 — Threads 16-22)

Continuation of "Max - Support Email Content". See Part 1 for the anonymization key and Threads 1-15.

---

## Thread 16: Marketo Issue — stuck list import requiring manual cancellation ([Company_J], Zendesk Ticket [id_redacted])

**Date:** 2026-02-05 to 2026-02-06
**Subject:** Marketo Issue

### Issue

Marketo's API silently failed mid-upload during a list import for a [Company_J] job. Mike (Seventh Sense) reached out directly to [Person_P] and [Person_N] asking them to manually cancel the stuck list upload, since Seventh Sense has no Marketo API to do this programmatically.

### Resolution playbook Mike provided

1. Navigate to the campaign in Marketo
2. Go to "List Actions" → "Show Import Status" → click "STOP"
3. Everything self-heals from there

### Critical correction during the resolution

Mike initially sent the wrong link (campaign URL). **Cancellation must be done on the DELIVERY LIST, not the campaign.** [Person_N] jumped in and confirmed the cancellation on the right list. Even after cancellation appeared confirmed, the dialog reverted to "still importing" — likely because multiple users had cancelled and re-triggered. [Person_Q] (Erik LaBianca, Seventh Sense) confirmed via Zendesk that after cancelling the stuck import, API calls were succeeding and the campaign showed "campaign sent" around 5:03 PM EST. Ticket closed.

### Educational follow-up from Mike

Mike sent a KB article link the next day: **"Dealing with mailing delays in Marketo due to list import errors"**. Root cause explanation: Marketo's API silently fails mid-upload, providing no error response, and the process hangs. There is no Marketo API for Seventh Sense to kill the list upload and retry. In most instances, this resolves itself because Marketo doesn't silently fail and Seventh Sense's retry mechanism picks it up — but when it does silently fail, manual customer intervention is required.

### Key insights for MAX

- **Cancel must happen on DELIVERY LIST, not the campaign** — easy mistake to make
- KB article: "Dealing with mailing delays in Marketo due to list import errors" is the canonical reference
- Workflow when calling out a stuck import: customer cancels → Seventh Sense retries succeed → Zendesk ticket closes (replying re-opens)
- Mike's pattern: provide immediate fix instructions, then send detailed root-cause KB article the next day for education

---

## Thread 17: Job restart confirmation — [Company_J] (Zavier)

**Date:** 2026-02-04
**Subject:** Started scheduling for jobs [id_redacted]

### Summary

Mike forwarded a "started scheduling" notification to [Person_R] at [Company_J] proactively explaining: "This was me restarting the job as I wanted to make sure all went well. I know we're on thin ice, so we're trying to alleviate any additional hiccups." [Person_R] reacted positively. Mike confirmed: "All is good. As mentioned, I was simply crossing our i's and dotting our t's."

### Key insight for MAX

Pattern: with high-stakes accounts ("on thin ice"), Mike will manually restart jobs as a precautionary measure and proactively communicate so the customer doesn't see the system-generated alert as a problem.

---

## Thread 18: Started delivery — alerts now to mktauto, daily bulk extract capacity reduced ([Company_J])

**Date:** 2026-01-27
**Subject:** Started delivery for jobs [id_redacted]

### Summary

Mike forwarded a "Started delivery" notification (1.5M-recipient job) to [Person_R], [Person_P], and [Person_S] at [Company_J] with operational changes: "All job updates and any alerts are now firing to not only the job owner, but also the mktauto email address. We've also backed down the daily bulk extract API capacity limit to 2GB."

### Key insight for MAX

Operational tuning at [Company_J]: alerts go to a generic mktauto address (not just job owner) for redundancy. Daily bulk extract API capacity was reduced to 2GB to manage Marketo load.

---

## Thread 19: Security question — Split Test Automation HubSpot app (Zendesk Ticket [id_redacted])

**Date:** 2026-01-26
**Subject:** Security question about Split Test Automation HubSpot app

### Question from [Person_T]

Asked what data is shared with the Split Test Automation app.

### Mike's response

**Data shared = email addresses and VIDs (HubSpot's unique identifier for a contact).** Mike also notes: "HubSpot now has a similar [native] capability" — which is candid product-positioning info.

### Key insight for MAX

Standard answer: Split Test Automation app shares only email + VID. Important caveat to flag — HubSpot has since added similar native functionality, which may affect why customers are evaluating the standalone app.

---

## Thread 20: Demandbase renewal — order form + Zip vendor questionnaire

**Date:** 2026-01-20 to 2026-01-21
**Subject:** Follow Up on DB ↔ Seventh Sense Order Form

### Summary

[Person_U] (Procurement Manager at [Company_L]) reached out about the renewal proposal. New procurement process at [Company_L]; asked for additional discount. Mike replied that costing math is tight but offered an additional discount as the best he could do. [Person_U] accepted, updated the Zip request with the new order form, and sent Seventh Sense a vendor questionnaire via Zip. Mike confirmed he received the Zip invite, completed the vendor questionnaire the next day.

### Key insight for MAX

[Company_L] uses **Zip** for procurement workflows including vendor questionnaires. Pattern: procurement contact comes in with discount ask, Mike runs costing math and offers a modest additional discount, complete the Zip vendor questionnaire to finalize.

---

## Thread 21: Mallard Bay training follow-up

**Date:** 2026-01-22
**Subject:** Seventh Sense & Mallard Bay → Training Follow Up

### Summary

Standard post-training follow-up email to [Person_V] and [Person_W] at [Company_M].

---

## Thread 22: Job via Smart List Issue — only sent to 455k of 1.5M ([Company_J])

**Date:** 2026-01-20 to 2026-01-21
**Subject:** Job via Smart List Issue

### Initial issue from [Person_R] at [Company_J]

Email scheduled for Jan 15 used a smart list within the program but only sent to 455k of 1.5M intended recipients. Then a separate, follow-up issue: another job kept failing — less than halfway through API limits without specifying why. [Person_R] also got 20-25 alert emails per minute even after pausing the send.

### Mike's response

"Things are certainly not starting off on the right foot. I'll respond in a bit on all of this." Then: told [Person_R] he could unpause the job — "We know what's going on and this can sometimes happen." Followed up with combined detailed response addressing both items, with the Marketo failure-notification cause explained.

### Key insights for MAX

- Smart List partial-delivery issues are a recognized failure mode at the [Company_J] account
- Alert volume pattern (20-25/minute) when a job fails — known and expected
- Mike's tone with high-stakes customers having a bad start: candid acknowledgment ("not starting off on the right foot"), then quick reassurance, then detailed root-cause breakdown

---
