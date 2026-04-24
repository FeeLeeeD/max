# Max - Support Email Content (Part 2 of 6 — Threads 5-9)

Continuation of "Max - Support Email Content". See Part 1a for the anonymization key.

---

## Thread 5: Training follow-up — [Company_A]

**Date:** 2026-03-19
**Subject:** Seventh Sense & [Company_A] → Training Follow Up

### Summary

Standard post-training follow-up email from Mike to [Person_A] and [Person_B] at [Company_A]. Included: link to notetaker recap, link to general HubSpot knowledge base, reminder that each workflow action has support documentation linked within the action itself, and the support email (`support@theseventhsense.com` — goes to a broader group including Mike) for timely questions.

---

## Thread 6: Training follow-up — [Company_B]

**Date:** 2026-03-18
**Subject:** Seventh Sense & [Company_B] → Training Follow Up

### Summary

Standard post-training follow-up to [Person_C] and [Person_D] at [Company_B]. Same template as Thread 5 (notetaker recap link, KB link, support email reminder).

---

## Thread 7: Annual subscription renewal — [Company_C]

**Date:** 2026-03-05 to 2026-03-20
**Subject:** Seventh Sense & [Company_C] → Annual Subscription Renewal

### Initial outreach from Mike (Seventh Sense)

Reached out to [Person_E] (VP Brand Marketing & Communications at [Company_C]) on two items: subscription renewal scheduled for March 10, and request to schedule a reconnect to demo recently released capabilities.

### Reply from [Person_E]

OOO next week — asked Mike to hold the renewal until they could connect.

### Follow-up reply from [Person_E] when back

Three points to address before reconnecting:

1. They opted into Seventh Sense's Enterprise plan because their company requires custom T&Cs — that plan was the only way to negotiate that with Seventh Sense.
2. Their actual usage is much lower than the Enterprise threshold; they want to downgrade. Want to see the renewal doc to review required language.
3. Their key champion has left the team and the remaining crew isn't as savvy. Want a walk-through of functional highlights, anything new, and the dashboard.

### Response from Mike (Seventh Sense)

On point 1: Correct — [Company_C]'s legal team required an MSA, which Seventh Sense can only support through an Enterprise plan. If [Company_C] no longer needs the MSA-defined terms and Seventh Sense's standard ToS are acceptable, they can easily downgrade. Attached the fully executed MSA for reference.

On point 2: With a downgrade and no need to support the MSA, **there is nothing to sign** — these subscriptions are handled via credit card in Seventh Sense's subscription management system.

On point 3: Happy to walk through this on the call. Offered a dedicated working session in the coming weeks if helpful — "We want you to succeed with the system."

### Resolution

Meeting scheduled for Wednesday at 11:30 ET (rescheduled due to Mike's wife's medical procedure running late). [Person_E] was understanding ("real life is much more important").

### Key insight for MAX

Pattern: Enterprise plan's primary differentiator vs. standard plan is the ability to support a customer-specific MSA. When customers' usage is below Enterprise threshold and they don't need a custom MSA anymore, Seventh Sense can downgrade to a credit-card-managed subscription with no contract to sign.

---

## Thread 8: Error in HubSpot workflows — [Company_D]

**Date:** 2026-03-12 to 2026-03-17
**Subject:** Error in HubSpot workflows

### Initial question from [Person_F] at [Company_D]

Has been seeing a workflow error frequently as of yesterday. Sent screenshot. Asks what it is and how to troubleshoot.

### Response from Mike (Seventh Sense)

These errors can surface occasionally for various reasons:

- HubSpot having an issue
- The global network (specifically Cloudflare) having issues
- Seventh Sense having an issue

**There's nothing to troubleshoot** — failure mechanisms are in place. People won't get stuck in a workflow action; they'll move to the next action after a timeout period. Customer doesn't need to do anything.

Hard to identify root cause sometimes because Seventh Sense can't always see if HubSpot is having an issue, especially if not publicly reported. Saw a specific automation had a few delivery failures to HubSpot during yesterday's 4 PM hour, though most deliveries succeeded within that hour. The failures will not get "stuck" in the action.

Asked if they're seeing any errors today and offered to discuss recently released capabilities.

### Follow-up from [Person_F]

No errors today; will continue to monitor.

### Resolution

Mike noted they would let [Person_F] know if they identified root cause. No further action needed.

### Key insight for MAX

Standard answer for intermittent workflow errors: failure mechanisms exist; contacts don't get stuck; nothing for customer to do. Possible upstream causes: HubSpot, Cloudflare, or Seventh Sense itself. Hard to attribute when HubSpot doesn't publicly report status.

---

## Thread 9: HubSpot workflow errors — newsletter sent all at once (agency [Company_E])

**Date:** 2026-03-04 to 2026-03-19
**Subject:** HubSpot workflow errors

### Issue 1 (March 4) from [Person_G] (HubSpot consultant at agency [Company_E])

A newsletter for client [Company_F] (Dalmec) went out via HubSpot the prior day and "all sent at the same time" — i.e., throttling didn't work. Asked if she needed to uninstall/reinstall.

### Diagnosis & response from Mike (Seventh Sense)

Root cause identified immediately: **two accounts had been created for the same client**, so HubSpot didn't know which one to communicate with. One account was created June 9, 2025 (by [Person_H]'s user); the other was created November 30, 2025 (by [Person_G]'s user).

Mike completely wiped the duplicate and added [Person_G] as admin to the original.

**Important best practices Mike conveyed in the same email:**

- Check for other duplicate accounts; in Seventh Sense you can see all accounts you have permission to access by clicking the account/user name in the top right of the screen.
- If accounts exist solely under one teammate's user (and vice versa), invite each other to those portals. **Sharing usernames/passwords is a very bad security practice.**
- Invite users via Settings → Manage users. Role-based administration is supported.
- For agency clients: if you want to give clients access to their Seventh Sense instance, invite them only to that instance — they won't see other clients you support.

[Person_G] then asked Mike to also check Corvirtus (another client). Mike confirmed Corvirtus had only one account so they were fine.

### Issue 2 (March 19) — same agency, Corvirtus

Mike's send for Corvirtus that morning errored and sent to all contacts at once. Asked Mike to look.

### Diagnosis & response from Mike

Root cause: **someone from the agency or Corvirtus had disabled the HubSpot integration on March 13** (an explicit human action; HubSpot doesn't auto-disable connectors). Therefore HubSpot had nothing to talk to.

Resolution path: Go to the connector settings, click the hamburger menu, reconnect the integration. **A Super Admin must complete the integration within the next 24 hours.**

After [Person_G] tried to reconnect, the issue persisted. Mike removed the connector entirely from Seventh Sense's side and asked her to add it back. That worked. Mike provided a status link [Person_G] can use to verify the connector — green check = good.

### Key insights for MAX

- **Duplicate accounts** for the same client portal are a recurring and high-impact issue: when HubSpot has two Seventh Sense accounts to talk to, it bypasses Seventh Sense entirely and emails go out unthrottled. Diagnostic: look at account creation timestamps and creator users.
- **Agency model** specifics: agency teammates should invite each other to their clients' portals, never share credentials. Use role-based admin. Invite end-clients only to their own instance to avoid cross-client visibility.
- **Connector disabled** in HubSpot is also a "send-all-at-once" failure mode — different root cause but same symptom. Always requires a human action to disable.
- **Recovery for stuck/broken connectors:** if reconnecting from the customer side doesn't work, Mike can remove the connector entirely from Seventh Sense's side, which forces a clean re-add. Super Admin must complete reconnection within 24 hours.

---
