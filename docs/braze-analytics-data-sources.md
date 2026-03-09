# Braze analytics: what can and cannot be generated via API

This document clarifies which Braze analytics data can be **generated or updated via the REST API** (e.g. `/users/track`) and which **only come from Braze’s own systems** (message delivery, SDK, tracking pixels).

References: [Funnel Reports](https://www.braze.com/docs/user_guide/analytics/reporting/funnel_reports), [POST /users/track](https://www.braze.com/docs/api/endpoints/user_data/post_user_track/), [Email tracking](https://www.braze.com/docs/user_guide/analytics/tracking/email_tracking/).

---

## Can be generated via API (`/users/track` and related)

| Data | How | Use in reports |
|------|-----|-----------------|
| **User attributes** | `attributes` array: standard (e.g. `first_name`, `email`, `country`) and custom attributes. | Segments, personalization, dashboard filters. |
| **Custom events** | `events` array: `name`, `time`, `properties`. Any event name you define. | Funnel step “Performed Custom Event”, retention, segments, Report Builder. |
| **Purchases** | `purchases` array: `product_id`, `currency`, `price`, `quantity`, `time`, optional `properties`. | Funnel step “Made Purchase”, revenue reports, segments. |

So for **funnel reports**, you can fully generate:

- **Performed Custom Event** (any custom event name)
- **Made Purchase**

You can also create/update users so they exist when you later send them a campaign or Canvas (so “Message received” and engagement can then be recorded by Braze).

---

## Cannot be generated via API (system-generated only)

| Data | Source | Why API can’t create it |
|------|--------|--------------------------|
| **Message received** | Braze records this when a message is **delivered** (campaign/Canvas send). | No REST endpoint to “mark user as received message X”; it’s tied to actual delivery. |
| **Message engagement (opens, clicks, “Interacted with Step”)** | Braze records when the **client** loads the open pixel or hits a tracked link (email), or when the SDK reports in-app/push interaction. | Opens/clicks come from Braze’s tracking infrastructure (pixel, link wrapping), not from a generic “log event” API. |
| **Started Session** (in funnel) | Typically from the **Braze SDK** (session start). | Funnel “Started Session” is intended for SDK-reported sessions; there is no documented way to backfill it via `/users/track` for funnel reporting. |

So for **funnel reports**, these steps are **not** something you can “generate” with the API alone:

- **Received message** (first step) – requires a real send to that user.
- **Message Engagement Event** / **Interacted with Step** – requires real message interaction (open/click).
- **Started Session** – in practice, from SDK; not designed to be faked via API for funnel.

---

## Summary for the Report Data Generator

- **Phase 1 (API-only):** Generate **user attributes**, **custom events**, and **purchases** with configurable volume. Funnel reports will show “Performed Custom Event” and “Made Purchase” steps; “Message received” and “Message engagement” will stay empty until real messages are sent and interacted with.
- **Phase 2 (message-aware):** Trigger real **campaign/Canvas sends** to generated users (e.g. via `/campaigns/trigger/send` or `/canvas/trigger/send`). Then “Message received” is populated by Braze. **Opens/clicks** still require real client interaction (see Playwright option below).

---

## Playwright / browser automation for message engagement

**Question:** Can we automate “load web app as each user, receive and interact with messages” (e.g. with Playwright) to quickly generate profiles with engagement?

**Answer:** Yes, **if** the following are true:

1. **You have a web app** that:
   - Identifies the user (e.g. by `external_id` or email) and has the Braze Web SDK (or equivalent) integrated.
   - Can receive messages in a way the browser can interact with (e.g. in-app messages, or emails that open in browser / link to a web page).

2. **Flow you can automate:**
   - Create or select user (API or app login).
   - Trigger campaign/Canvas send to that user (REST API).
   - In the browser (Playwright): load app as that user → message appears (in-app or via email link) → script performs “open”/“click” (e.g. click CTA, load tracking URL).
   - Braze then records **message received** and **message engagement** (opens/clicks) from real delivery and interaction.

3. **Caveats:**
   - **Email:** “Open” is usually recorded when the **tracking pixel** in the email is loaded. Automating that means either rendering the email in a browser (e.g. open link to a “view email” page) or loading the pixel URL; link **clicks** can be automated by navigating to the tracked link.
   - **In-app / web push:** If the web app shows in-app messages or web push and the SDK reports interactions, Playwright can click/dismiss and generate real engagement.
   - **Scale and reliability:** Each “user” needs a real send and a browser interaction; rate limits, delivery delay, and UI stability affect how fast you can run this.

So: **message interactivity that fills funnel/engagement analytics can be automated with something like Playwright**, provided you have a web app where each user can be identified and where messages are delivered in a way the browser (and Braze tracking) can record. The API alone cannot create those engagement events; Playwright can drive the real client behavior that does.
