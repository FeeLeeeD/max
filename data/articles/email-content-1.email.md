# Max - Support Email Content (Part 1 of 6 — Anonymization Key + Threads 1-4)

This file contains anonymized customer support email threads pulled from the "AAA - Max Support" Gmail label. All personally identifiable information (names, email addresses, phone numbers, company names other than Seventh Sense, account numbers, login credentials, etc.) has been removed or replaced with generic placeholders.

Anonymization rules applied:

- People → `[Person_A]`, `[Person_B]`, etc. (consistent within each thread)
- Companies → `[Company_A]`, `[Company_B]`, etc. (consistent within each thread)
- Seventh Sense / Telepath Data / 7th Sense → kept as "Seventh Sense"
- Generic third-party tools (HubSpot, Marketo, Zoom, Slack, Cloudflare, Adobe Engage, etc.) → kept as-is
- Email addresses → `[email_redacted]`
- Phone numbers → `[phone_redacted]`
- Identifying URLs (account/job-specific) → `[url_redacted]`
- Account numbers, ticket numbers, job IDs → `[id_redacted]`
- Dates: kept for temporal context

---

## Thread 1: Workflow + throttling question

**Date Range:** 2026-04-14 to 2026-04-15
**Subject:** [Seventh Sense] Workflow + throttling question (Zendesk Ticket [id_redacted])

### Initial question from [Person_A] at [Company_A] ([Person_A] = customer)

Two questions about the single send throttling + recycling workflow for an upcoming newsletter:

1. Do they only need to update the Trigger Enrollment node and the Send Email node? Anything else needed to trigger the send?
2. Is there a way to set the send timeframe to exclude delivery on weekends? Example: a send to deliver over 5 days starting Wednesday April 15, but that will end on Sunday.

### Response from Mike (Seventh Sense)

1. Correct — update the trigger enrollment and email send actions. Since they are using an existing flow, recommended turning the workflow off and back on to avoid issues with the workflow run-once rule.
2. Just added [Person_A] to a beta that allows selecting global blackout periods that the AI's scheduler will not be able to pick from. Found under "Campaign orchestration" within Seventh Sense. In their case, they'd need to add two more days to the delivery window (so 7 total), but weekends will not be available to the scheduler. Override options: delete the global blackout after the email, or use a new checkbox in the workflow action that overrides orchestration.

### Follow-up from [Person_A]

Set up the global blackout periods. Times displayed on the right are in PDT. Question: does this mean (a) the AI scheduler will not choose Saturday/Sunday in the local timezone of the recipient, OR (b) the AI scheduler will avoid Saturday/Sunday from 12am - 11:59pm in PDT?

### Response from Mike (Seventh Sense)

The AI's scheduler will not schedule emails during Saturday and Sunday from 12am - 11:59pm in PDT. In essence, it becomes invisible or skips over them. Even if someone's peak engagement time is over the weekend, it will say "I can't pick that, let me look at other available days." Also, Seventh Sense doesn't adjust for a recipient's time zone — it's all based on relative time.

### Resolution

[Person_A] confirmed understanding.

---

## Thread 2: HubSpot Workflow API Down (HubSpot internal escalation)

**Date:** 2026-04-02 to 2026-04-07
**Subject:** HubSpot Workflow API Down

### Issue (from Mike, Seventh Sense, to HubSpot reps)

Part of HubSpot's workflows API was down or having issues — Seventh Sense was receiving numerous support tickets from joint customers. The URL `https://api.hubapi.com/automation/v3/workflows?stats=true&count=100` was returning 500 errors. HubSpot status page showed nothing. Asked HubSpot to escalate.

### Mike provided additional info

A curl command demonstrating the failure with response: `{"status":"error","message":"internal error","correlationId":"[id_redacted]"}`

### Mike escalated further to senior HubSpot contacts

After hours of no response from HubSpot support (and no callback because of a "regional holiday"), Mike forwarded to senior HubSpot contacts saying "You said to reach out if we ever needed help. We need help. The automation API is broken when querying workflows, and numerous joint customers are growing increasingly frustrated. This has nothing to do with us — we're spending time fire fighting for HubSpot."

### Resolution from HubSpot Engineering (via [Person_HS_Engineer])

Engineering team identified the root cause: the token didn't have the correct permissions for that endpoint. There was a problem where for that specific permission they were not returning the correct error message but a 500 instead. Actual error: `[NOT_AUTHORIZED]: Request does not have correct product scopes. At least one of [USERS_READ] is required`.

### Erik (Seventh Sense CTO) noted

Seventh Sense has been requesting `crm.objects.users.read` for years. No code changes recently. Working yesterday. Asked if there's a way to verify scopes on token directly. HubSpot pointed to the token introspect endpoint.

### Resolution

HubSpot team implemented a fix on their side. Erik confirmed it was working. No action needed on Seventh Sense's end. Issue resolved within ~2 hours of escalation. HubSpot rep [Person_HS_Manager] later followed up confirming the engineering lead rolled back the change and recommended using HubSpot's escalation form for future issues.

---

## Thread 3: Email delivery optimization question

**Date:** 2026-03-26
**Subject:** [Seventh Sense] Email delivery optimization question (Zendesk Ticket [id_redacted])

### Initial question from [Person_A] at [Company_A]

For a just-launched campaign, set the send window to one day, but then decided it should be shorter and updated it to 5 hours. Will it impact contacts already in that wait step (will it speed up the rate of sends)? Or won't it because the workflow was already enabled?

### Response from Mike (Seventh Sense)

If you change the delivery window for someone who is already scheduled, they will not be rescheduled to the new window.

If it's imperative to change it, the workaround is: clone the workflow → update the delivery window → turn the old one off → add a branch to the top so anyone who has already received email goes down a branch that does not send an email (this prevents duplicates) → activate the workflow.

### Follow-up from [Person_A]

When scrolling through the held contacts in the optimization step, everyone is currently marked as being on hold for 1 day and 2 hours. Does that mean they will not be released until tomorrow + 2 hours?

### Response from Mike (Seventh Sense)

That's not when they'll actually receive their email — it's a fail-safe mechanism to ensure no one ever gets stuck in that step. Once the action is activated, Seventh Sense tells HubSpot that if HubSpot doesn't hear back from Seventh Sense within `<delivery_window> + 4 hours`, it should move the contact to the next step. The actual email distribution times can be viewed in the workflow actions page within Seventh Sense.

### Resolution

[Person_A] looked at the distribution and confirmed most contacts will be delivered within the day, so kept the workflow as is.

---

## Thread 4: Question: Seventh Sense for HubSpot — throttling capabilities

**Date:** 2026-03-25
**Subject:** [Seventh Sense] Question: Seventh Sense for Hubspot (Zendesk Ticket [id_redacted])

### Initial inquiry from [Person_A] at [Company_A] (a marketing services agency)

[Company_A] is moving some marketing email efforts from Salesforce Marketing Cloud (SFMC) to HubSpot. One feature critical to their work is the ability to throttle email sends. Various factors affect the throttle rates and speeds — SFMC has a built-in tool that lets them throttle with great ease.

HubSpot recently launched a beta for a similar tool, but it has limitations:

- Minimum send rate is 120/minute (7,200/hour)
- Cannot change from minute to hour
- Cannot send below the minimum (compared to SFMC which allows minimums around 500/hour)

They tested HubSpot's workflows option for throttling but found it incredibly time-consuming, creating room for error. Will not work for them when deploying a high volume of email projects with only one person scheduling.

Question: Can Seventh Sense assist with email throttling? If so, how?

### Response from Mike (Seventh Sense)

Yes — Seventh Sense can fully automate and manage email throttling natively within HubSpot, replacing the need to build time-consuming, error-prone branching logic or rely on HubSpot's rigid beta limitations.

Instead of forcing a strict "batch size per minute," Seventh Sense controls throttling through a **delivery window**:

**Flexible Delivery Windows** — Define the duration over which the email should send. Window can be as short as 1 hour, up to 7 days, or anything in between (12 hours, 36 hours, etc.). Once set, the AI calculates the pacing and trickles the list out over that timeframe.

**Micro-Throttling** — While native tools tend to blast emails in chunks at the top of the hour or minute, Seventh Sense uses "micro-throttling": the system randomizes send times down to the minute and second across the entire delivery window. This prevents the "burst" sending behavior that triggers corporate firewalls and spam filters, resulting in a more human-looking delivery pattern that appeases inbox providers.

**Customizable Throttling Types** — Choose how volume is distributed without doing the math:

- _Personalized (Default)_ — System throttles the list naturally by analyzing each person's engagement history and sends based on their proven peak engagement time within the defined window.
- _Even Distribution_ — For strict, consistent trickle (manage internal capacity or server limits). Example: 3,000 emails over a 7-day (168-hour) window throttles to a smooth 17-18 emails per hour.
- _Randomized_ — Randomly assigns send times across the audience throughout the entire window.

**Streamlined Workflow Templates** — Pre-built template library that can be pushed directly into the HubSpot portal:

- Solo scheduler doesn't need to build complex delays or branching logic from scratch
- Clone a pre-built template, drop in audience list, set delivery window (e.g., 24 hours), turn it on
- AI handles all the complex distribution and throttling in the background

### Resolution

Mike provided a free-trial link and noted a follow-up conversation already scheduled.

--,
