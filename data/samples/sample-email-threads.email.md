Max — Support Emails (Part 1 of 6 — Threads 1–4)

Anonymized excerpts of support threads between Seventh Sense and customers.

Anonymization rules:

- People → [Person_A], [Person_B], … (unique per real person)
- Companies → [Company_A], [Company_B], …
- Internal IDs / URLs / email addresses → [id_redacted], [email_redacted]
- Product names and concrete numbers are preserved verbatim.

---

## Thread 1: Workflow + throttling question

**Date Range:** 2026-04-14 to 2026-04-15
**Subject:** [Seventh Sense] Workflow + throttling question (Zendesk Ticket [id_redacted])

### Initial question from [Person_A] at [Company_A] ([Person_A] = customer)

Hi team — two quick questions about our AI-scheduled HubSpot workflow. (1) Does the per-hour throttle cap (we set 2,000/hr) apply to AI-picked send times, or only as a safety net? (2) With weekend blackout on, if someone's optimal time is Saturday 10am, do they skip the send entirely, or get bumped to a weekday?

### Response from Mike (Seventh Sense)

Hi [Person_A] — (1) Throttle is a hard ceiling that cooperates with the AI. Overflow reshuffles inside each recipient's personal optimal window, nobody gets dropped. (2) Weekend blackout moves the send, it doesn't drop it. A Saturday-optimal subscriber gets their next-best weekday slot — usually Monday morning based on their profile, not a fixed fallback time. Also double-check that Send Time Optimization is enabled at the workflow level, not just account-wide.

### Follow-up from [Person_A]

Does the Monday fallback cause a Monday-morning spike, or is it spread out?

### Response from Mike (Seventh Sense)

Spread. Each weekend-optimal subscriber has their own second-best weekday slot, so fallbacks land across roughly 7–11am rather than clustering. The hourly throttle still applies, so even unlikely clusters get smoothed.

### Resolution

[Person_A] confirmed the behavior and left the workflow running with throttle 2,000/hr + weekend blackout + per-workflow STO.

---

## Thread 2: Warming up a new sending domain

**Date:** 2026-03-09 to 2026-03-10
**Subject:** [Seventh Sense] New sending subdomain — warm-up plan? (Zendesk Ticket [id_redacted])

### Initial question from [Person_B] at [Company_B]

Hey — we're moving marketing sends from our primary domain (`[Company_B].com`) onto a dedicated subdomain (`go.[Company_B].com`) to protect the corporate domain reputation. We've got about 180,000 marketing contacts. Do we need to run a manual warm-up plan or can Seventh Sense's "gradual warm-up" mode handle that automatically?

### Response from Mike (Seventh Sense)

You're on the right track splitting the subdomain off — that's the standard pattern.

For a 180k list, enable Gradual Warm-Up on the new subdomain's sending profile and Seventh Sense will ramp volume over 14 days using an engagement-first order: your most-engaged recipients in the first few days, working outward. You'll start around 2–3k/day and reach full volume near day 12. During warm-up the AI will also avoid your least-engaged cohort entirely until the reputation is established.

Two things you should still do manually:

- Publish SPF, DKIM, and DMARC records for `go.[Company_B].com` before the first send. Warm-up from an un-authenticated domain wastes the ramp.
- Send a small transactional-flavored "we're moving" note from the new subdomain to your top ~5k most-engaged contacts about a week before the warm-up begins. That bootstraps engagement history the algorithm can then use to pick the warm-up order.

### Resolution

[Person_B] published DNS records, sent the bootstrap mail to top engagers, and enabled Gradual Warm-Up. No further questions.

---

## Thread 3: A/B testing subject lines with per-segment winners

**Date:** 2026-02-02 to 2026-02-04
**Subject:** [Seventh Sense] Subject line A/B tests — segment-level winners? (Zendesk Ticket [id_redacted])

### Initial question from [Person_C] at [Company_C]

Hi — our content team wants to A/B test two subject lines on our monthly product digest (about 95k recipients). In HubSpot the native A/B test picks a single winner based on 24-hour open rate and sends it to everyone else. We've noticed the "winning" subject line often loses badly in one of our three audience segments (SMB, mid-market, enterprise).

Is there a way with Seventh Sense to let each segment have its own winner rather than rolling up to a global winner?

### Response from Mike (Seventh Sense)

Yes — this is exactly what the "Segment-Aware A/B" mode was built for. In the Seventh Sense UI under Experiments → A/B, switch the winner-selection strategy from "Global" to "Per Segment" and attach the segments you care about (in your case the three SMB / mid-market / enterprise lists).

Seventh Sense will then run the test concurrently in each segment, pick the winner for that segment independently based on its own 24-hour open and click signals, and dispatch the winner to the remainder of that segment on AI-scheduled times. You'll see three winners in the report instead of one, and the per-segment lift usually beats the global-winner approach by 8–15% on click-through in audiences like yours where SMB and enterprise respond to very different copy.

One caveat: each segment needs enough sample to reach significance on its own. With 95k split across three segments you're fine, but if you ever test on a list where one segment has fewer than ~5k recipients, it'll fall back to the global winner for that segment and note it in the report.

### Follow-up from [Person_C]

Makes sense. Does Per-Segment A/B play nicely with Send Time Optimization, or do we have to pick one?

### Response from Mike (Seventh Sense)

They stack. The A/B mode picks which subject line a recipient gets; STO picks when they get it. Per-Segment A/B runs first (at test-sample dispatch), the winner is chosen inside each segment, and then STO schedules the winner send per recipient within each segment. You get both lifts together.

### Resolution

[Person_C] configured Per-Segment A/B for the next product digest, kept STO on, and confirmed the experiment report showed three distinct winners. Noted a clear copy-style difference: SMB preferred benefit-led subject lines, enterprise preferred outcome-led subject lines.

---

## Thread 4: Segment engagement scoring — drift, thresholds, and re-engagement

**Date Range:** 2026-01-18 to 2026-01-26
**Subject:** [Seventh Sense] Segment engagement score keeps drifting down — how to read it? (Zendesk Ticket [id_redacted])

### Initial question from [Person_D] at [Company_D]

Hi team — we've been watching the engagement-score distribution in our main marketing list for about six months now and the overall shape has shifted noticeably. When we started, the mode of the distribution was around 62 and the median was 58. Today the mode is closer to 51 and the median is 47. Our send volume hasn't changed, our content calendar is basically the same, and our unsubscribe rate and bounce rate are both well below their historical norms. So I'm trying to understand what that shift in the engagement score is actually telling us.

A few specific questions:

1. How is the per-recipient engagement score computed? We can see the 0–100 number in the contact view but I can't find docs on what goes into it beyond "open and click history."
2. Is a six-month drift from 58 → 47 on the median meaningful, or is that within normal noise?
3. Our re-engagement workflow triggers when a contact's score drops below 40. Given the overall distribution has shifted down, should we be adjusting that threshold, or is an absolute cutoff still the right call?

We want to make sure we're not firing re-engagement campaigns at people who are actually fine, just because the whole list has cooled off a bit.

### Response from Mike (Seventh Sense)

Great question — and the fact that you're looking at the distribution rather than just individual scores is exactly the right instinct. Let me take the three pieces separately.

**How the score is computed.** The per-recipient engagement score is a weighted rolling function of four inputs, re-scored nightly:

- Recency of last meaningful interaction (open or click). Recency decays on an exponential schedule — a click 3 days ago is worth more than a click 60 days ago by a large factor.
- Frequency of interactions over the past 90 days, capped so one very active week doesn't dominate.
- Diversity of interaction types. A recipient who both opens and clicks scores higher than one who only opens, even at the same raw count.
- Negative signals: bounces (soft), complaints, and a stretch of zero engagement across multiple sends all pull the score down.

The four are combined into a 0–100 number; 50 is calibrated to be the "average engaged subscriber" at list-build time. That calibration is important for interpreting question (2).

**Is a 58 → 47 median drift meaningful?** It's at the edge of what we'd call normal. Score distributions naturally soften by 3–5 points over a six-month window as cohorts age and recency decays — so a 58 → 54 shift would be routine. A 58 → 47 shift is outside that band and usually has one of three causes: (a) a recent big acquisition burst of low-intent subscribers is now dragging the median, (b) send cadence has crept up (even 1 extra send per week shifts the distribution because each low-engagement send pulls everyone's score down a bit), or (c) content relevance has drifted from what subscribers opted in for. I'd audit those three before adjusting anything algorithmic.

**Should you move the re-engagement threshold?** No — keep it absolute. The engagement score is deliberately calibrated so that "below 40" means "clear disengagement risk" regardless of the distribution shape. If you move the threshold to chase the shifted distribution, you end up re-engaging people who are basically fine and missing people who are actually disengaged. What you probably want to do instead is look at the tail below 40 specifically: is that tail growing, or is the whole distribution sliding down uniformly? If only the tail is growing, your re-engagement workflow is correctly catching it. If the whole curve is sliding, that points back to causes (a), (b), or (c) above and the fix is upstream of the threshold.

### Follow-up from [Person_D]

That's incredibly helpful — thanks. When I pulled the distribution chart for below-40 specifically, the tail has grown from about 6% of the list to about 11% over the same window. Median of the tail itself hasn't moved much (it's still around 28). So it sounds like the whole curve is sliding, not just the tail expanding.

We did run an acquisition push in September through a partner webinar — added about 14k new contacts. Could that be enough to account for the shift on its own, or do you think cadence/content is likely also involved?

### Response from Mike (Seventh Sense)

A 14k-contact add to a list of your size, if those contacts arrived with low intent (webinar attendees who weren't primary buyers, for example), can absolutely explain a 3–5 point median drop all by itself — new contacts start at a neutral score and drift down quickly if they don't engage with your first few sends. But a 58 → 47 shift (11 points on the median) is too large to pin entirely on one 14k batch unless that batch was extraordinarily low-intent.

I'd suggest two checks:

1. Build a segment of just the September cohort and look at its current engagement score distribution separately from the rest of the list. If that cohort sits mostly below 40, it's the primary driver. If it looks healthier than the below-40 tail overall, there's a second cause at work in your existing audience.
2. Pull your send cadence by month over the six-month window. Even a gradual creep from, say, 2 sends per week to 3 can account for a couple of points on the median because every low-engagement send compounds.

Once you know which cohort is carrying the drop, the fix is different: for the new cohort it's a welcome / re-onboarding series, for the existing audience it's usually cadence or content alignment.

### Resolution

[Person_D] segmented the September cohort and found it was mostly below 35 — confirming it was the primary driver. Deployed a short 3-email re-onboarding series, reset scores to neutral, and kept the 40-point threshold unchanged. List median recovered from 47 to 54 within five weeks.
