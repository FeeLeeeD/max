# Max - Support Email Content (Part 3 of 6 — Threads 10-15)

Continuation of "Max - Support Email Content". See Part 1a for the anonymization key.

---

## Thread 10: Delivery alert — list import stuck (Marketo + [Company_G])

**Date:** 2026-03-02
**Subject:** SeventhSense — Delivery alert for job [id_redacted]

### Initial alert

Automated Seventh Sense delivery alert: unable to complete delivery of 831 actions for job [id_redacted].

### Customer-side action ([Person_I] at [Company_G])

[Person_I] confirmed this is another instance of list import becoming stuck. They manually stopped/cancelled the list import via Marketo (per Seventh Sense's Zendesk KB article on "How to cancel a list import job in Marketo"). [Person_J] (Associate Director, Marketing Automation) confirmed import errors fixed.

### Mike (Seventh Sense) response

Logs confirm the **list upload silently failing in Marketo** is the culprit. Mike's frustration: "I really hope they fix that one of these days or provide an API that allows the system to automatically cancel it."

### Key insight for MAX

Recurring failure pattern: Marketo's list-upload API silently fails. Seventh Sense cannot automatically cancel a stuck list import (no Marketo API for this), so the customer must manually cancel via Marketo UI per the Zendesk KB. This is a known recurring issue at AbbVie-class accounts.

---

## Thread 11: Integration follow-up — [Company_H] (recycle testing)

**Date:** 2026-02-26 to 2026-03-05
**Subject:** Seventh Sense & [Company_H] → Integration Follow Up

### Summary

Standard post-training follow-up to [Person_K] at [Company_H]. Adds one item beyond the typical template: **Recycle Testing Review** — after running a few tests, schedule 30 minutes to review results and address questions before operationalizing the approach.

[Person_K] noted [Person_L] wants to start using it Monday. Booked a follow-up review meeting for the following Wednesday after running tests.

---

## Thread 12: Delivery alert — Marketo system hiccup (proactive customer comms)

**Date:** 2026-02-24 to 2026-02-25
**Subject:** Delivery alert for job [id_redacted]

### Issue

Auto-alert: 162 actions of a job could not be delivered.

### Mike's proactive note to [Person_M] at [Company_I]

"FYI we're monitoring this. The error code is associated with Marketo having a system issue. 99% of the time, this corrects itself once their system is back and fully online. If corrective measures needed, we'll let you know."

[Person_M]: "Thank you! I was wondering if I should flag it!"

### Resolution

Mike confirmed later: "All is good. Seems to have been a small hiccup that they fixed quickly."

### Key insight for MAX

Mike's proactive customer communication pattern for Marketo-side issues: get ahead of the customer before they ask. Reassure that 99% self-correct, and that Seventh Sense will alert if action is needed.

---

## Thread 13: Urgent issue: delivery failure for in-app scheduled jobs ([Company_I])

**Date:** 2026-02-17 to 2026-02-19
**Subject:** Urgent Issue: Delivery failure for in-app scheduled jobs

### Initial alert from [Person_M] at [Company_I]

Started experiencing delivery failures for all in-progress jobs scheduled via the Seventh Sense app. They had also experienced corporate website unavailability earlier the same day. They paused two jobs, then resumed them, but errors persisted. Tried "queueing failures for retry" — issue persisted on all jobs.

### Response from Mike (Seventh Sense)

Marketo was having an issue with their list upload API. This happens from time to time and is out of Seventh Sense's control. **The good thing is that Seventh Sense has failure mechanisms in place to continuously retry, and in most cases this works itself out (albeit you'll get a lot of alerts).** Mike checked all of [Person_M]'s jobs — all had self-healed.

Provided link to the KB article on how to cancel a list upload process in Marketo if it persists ("you can always kill the list upload process in Marketo and the job will clean itself up").

### Follow-up from [Person_M]

Asked Mike to resend the link. Also asked for any other documentation on app features/options/functionality beyond the Marketo Zendesk articles — wants to learn the available jobs and reporting.

### Response from Mike

Apologized for forgetting the link, resent it. Notes on KB transparency: "Full transparency, we're not the best at keeping it updated." Pointed [Person_M] to the **product updates page**, which they keep current with major capability releases. Mentioned starting a quarterly product update email since "no one wants to remember to visit a page." Also previewed an upcoming **executive dashboard** to identify improvement opportunities, successes, and issues to address — would like [Person_M]'s feedback once mockups exist.

### Key insights for MAX

- KB article: "How to cancel a list import job in Marketo" — keep handy for Marketo customers
- Mike's standard messaging: alerts are verbose by design ("belt and suspenders"); Seventh Sense would rather over-alert than miss issues
- Internal awareness: KB documentation is admittedly not well maintained; product updates page is the current source of truth for major capabilities
- Quarterly product update email is a planned communication
- Customer ask for an "executive dashboard" type view is a known need being worked on

---

## Thread 14: Marketo outage proactive notification ([Company_J])

**Date:** 2026-02-13
**Subject:** Completed delivery for job [id_redacted] (forwarded with context)

### Summary

Mike forwarded a successful job-completion notification to [Person_N] at [Company_J] (a major Marketo customer running 1.4M-recipient campaigns) with proactive context: "Marketo went down last night, however, our system acted accordingly and picked back up once it was up. Hence all the error messages that were sent." Provided link to Marketo/Adobe's status page for the event (`https://status.adobe.com/products/503491`), with a note: "they're definitely not correct on the timeline of their outage. Pretty infuriating, but that's Marketo." Job ultimately delivered 100% (1,443,418 of 1,443,418).

### Key insight for MAX

Pattern: When Marketo goes down at night and Seventh Sense's retry system completes the job successfully despite errors, Mike sends proactive context to the customer. Adobe's status page is sometimes wrong about outage timing/scope.

---

## Thread 15: Training follow-up + recycle threshold testing — [Company_K]

**Date:** 2026-02-10 to 2026-04-07
**Subject:** Seventh Sense & [Company_K] → Training Follow Up

### Summary

Standard training follow-up to [Person_O] at [Company_K]. Substantive content beyond the template:

- Mike checked tests [Person_O] had been running — results aligned with expectations.
- Recommendation: for a larger upcoming mailing, try the **1% recycling threshold** to gather more data for a longer-term recommendation.
- [Person_O] confirmed she'd try 1% on Thursday's send to her biggest list.
- Resurfacing: in April, [Person_O] reached out to schedule a results review after a couple of sends.

### Key insight for MAX

**1% recycling threshold** as a recommended starting point for accumulating data on bigger lists before tuning long-term settings.

---
