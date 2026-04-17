import {
  DEFAULT_CHUNK_OPTIONS,
  approxTokenCount,
  chunkText,
  type Chunk,
} from "../chunker.js";

const TEST_1 = `Email open rate is the percentage of recipients who opened your email.
A good open rate is typically between 17% and 28%, depending on your industry.`;

const TEST_2 = `Email open rate is a foundational engagement metric that measures the percentage of delivered messages your recipients actually opened. It is calculated by dividing unique opens by the number of delivered emails and multiplying by one hundred. Industry benchmarks vary widely, but most B2B senders see open rates between seventeen and twenty-eight percent, while B2C campaigns often perform slightly higher because the content tends to be more casual and visually driven.

Click-through rate, commonly abbreviated CTR, captures how many recipients clicked at least one link inside the email. It is the single most reliable indicator of message-level relevance because a click requires actual intent. The standard formula divides unique clicks by delivered emails, though some teams prefer click-to-open rate, which isolates copy and offer quality from subject-line performance. A healthy CTR for marketing broadcasts sits between two and five percent.

Bounce rate reflects the share of messages that could not be delivered to the inbox at all. Hard bounces come from permanent failures such as invalid addresses or closed mailboxes, while soft bounces are temporary issues like a full inbox or a server timeout. Keeping your hard-bounce rate below two percent is critical because mailbox providers use it as a spam signal, and repeated violations damage sender reputation quickly.

Unsubscribe rate measures how many recipients actively opted out after receiving a given message. A spike in unsubscribes usually points to a targeting mismatch, too-high send frequency, or content that drifted from the original value proposition. Healthy programs stay below zero point five percent per send. Always make the unsubscribe link easy to find, because hiding it only redirects unhappy readers to the spam button, which hurts deliverability far more than a clean opt-out.

Conversion rate closes the loop by measuring how many recipients took the business action the email was designed to drive, whether that is a purchase, a sign-up, or a demo request. It depends on the entire chain from subject line through landing page, so an email with strong CTR but weak conversion usually indicates a landing-page or offer problem rather than a messaging one. Most teams review this metric weekly alongside revenue per email sent.`;

const TEST_3 = `Email open rate is a foundational engagement metric that measures the percentage of delivered messages your recipients actually opened. It is calculated by dividing unique opens by the number of delivered emails and multiplying by one hundred. Industry benchmarks vary widely, but most B2B senders see open rates between seventeen and twenty-eight percent, while B2C campaigns often perform slightly higher because the content tends to be more casual and visually driven. Apple's Mail Privacy Protection, introduced in twenty twenty-one, has made this metric less precise for Apple Mail users because the feature preloads tracking pixels automatically, so modern marketers treat open rate as a directional signal rather than ground truth.

Click-through rate, commonly abbreviated CTR, captures how many recipients clicked at least one link inside the email. It is the single most reliable indicator of message-level relevance because a click requires actual intent. The standard formula divides unique clicks by delivered emails, though some teams prefer click-to-open rate, which isolates copy and offer quality from subject-line performance. A healthy CTR for marketing broadcasts sits between two and five percent, while transactional and triggered emails routinely exceed that because they arrive in direct response to a specific user action such as a password reset or shipping update.

Bounce rate reflects the share of messages that could not be delivered to the inbox at all. Hard bounces come from permanent failures such as invalid addresses or closed mailboxes, while soft bounces are temporary issues like a full inbox or a server timeout. Keeping your hard-bounce rate below two percent is critical because mailbox providers use it as a spam signal. Campaigns that repeatedly exceed that threshold face reputation damage, lower inbox placement, and in severe cases outright blocking by providers such as Gmail, Outlook, and Yahoo, which can take weeks of clean sending to recover from.

Unsubscribe rate measures how many recipients actively opted out after receiving a given message. A spike in unsubscribes usually points to one of three issues: a targeting mismatch, too-high send frequency, or content that drifted from the original value proposition that drove the subscription. Healthy programs stay below zero point five percent per send. Always make the unsubscribe link easy to find, because hiding it only redirects unhappy readers to the spam button, which damages deliverability far more than a clean opt-out ever would.

Conversion rate closes the loop by measuring how many recipients took the business action the email was designed to drive, whether that is a purchase, a sign-up, or a demo request. It depends on the entire chain from subject line through landing page, so an email with strong CTR but weak conversion usually indicates a landing-page or offer problem rather than a messaging one. Tracking this metric requires either UTM parameters or first-party event attribution, and most teams review it weekly alongside revenue per email sent to prioritize the next round of experiments.

A/B testing is the primary method teams use to improve these metrics over time. A disciplined program tests one variable per experiment, such as subject line, preheader, send time, call-to-action copy, or hero image, and reserves a holdout group large enough to detect realistic effect sizes. Running tests on tiny lists leads to noisy results that look dramatic but do not replicate. Always document the hypothesis before launching, pre-register the success metric, and resist the temptation to call a winner before the experiment reaches statistical significance.

Segmentation is the highest-leverage practice for lifting every metric simultaneously. Instead of broadcasting identical content to your entire list, split recipients by behavior, lifecycle stage, product interest, or engagement recency. Re-engagement campaigns targeted at subscribers who have not opened in ninety days should look and sound different from newsletters sent to power users. Teams that invest in segmentation routinely see two-to-three-times improvements in CTR and conversion compared to broadcast-only programs, with no increase in unsubscribe rate.

Deliverability is the invisible foundation under every metric above. Before any of these numbers matter, your mail has to reach the inbox rather than the spam folder or the void. Core deliverability hygiene includes authenticating your domain with SPF, DKIM, and DMARC, warming up new sending IPs gradually, keeping list hygiene tight through regular suppression of inactive addresses, and respecting engagement signals from mailbox providers. A single poorly targeted send to a cold list can undo weeks of careful reputation building.

Send-time optimization is a smaller but real lever that most teams underuse. Default wisdom says Tuesday or Thursday mornings work best for B2B, but your own engagement data will almost always beat generic benchmarks. Modern email platforms can schedule per-recipient send times based on each subscriber's historical open behavior, which typically lifts open rate by five to fifteen percent versus a single global send time. The effect is strongest for global lists spanning multiple time zones, where a single send time inevitably disadvantages whole regions.

Lifecycle automation separates programs that scale from programs that burn out. Welcome series, onboarding drips, abandoned-cart reminders, and post-purchase follow-ups should all run as always-on automated flows rather than manual broadcasts. These triggered messages consistently outperform one-off campaigns on every metric because they arrive at moments of high intent. Treating automation as a one-time setup project is a common mistake; the flows need regular review and iteration just like broadcast campaigns.

Mobile optimization is no longer optional because more than half of all email opens happen on a phone. Keep subject lines under fifty characters so they do not get truncated in mobile previews, use a single primary call-to-action per email rather than a dense list of links, and ensure your templates render cleanly on narrow screens without horizontal scrolling. Dark mode handling has become a specific concern for 2024 and beyond, since many clients now invert colors automatically in ways that can break carefully designed templates.

List growth needs as much attention as list engagement because every list naturally decays by twenty to thirty percent per year through bounces, unsubscribes, and slow disengagement. A healthy program invests continuously in acquisition through lead magnets, gated content, webinars, and referral programs. Equally important is preventing the list from becoming stale: sunset policies that automatically suppress chronically unengaged subscribers after six to twelve months keep your sender reputation clean and your metrics honest.

Reporting and attribution tie all of this together when done well. A useful dashboard shows the five core metrics side-by-side with rolling averages, flags anomalies visually, and links every number back to the underlying campaign so investigation is a single click away. Revenue per email sent is often the single most valuable metric for executive conversations because it translates engagement into business impact. Build the reporting once, automate it, and resist the temptation to measure everything; five well-understood metrics beat twenty poorly tracked ones every time.`;

const TEST_4 = `Email marketing operates on a small set of metrics that compound over time when used together rather than in isolation. Open rate tells you whether the subject line and sender name earned attention in a crowded inbox, click-through rate tells you whether the content inside delivered on the promise of that subject line, bounce rate tells you whether your list hygiene is strong enough to reach real mailboxes, unsubscribe rate tells you whether you are sending too often or to the wrong audience, and conversion rate tells you whether the full journey from inbox to landing page was compelling enough to drive real business outcomes. Treating these numbers as a dashboard rather than a set of isolated indicators is what separates amateur programs from professional ones. A team that watches only open rate will optimize for clickbait subject lines and then wonder why revenue does not move, and a team that watches only conversion rate will miss the upstream signals that reveal list decay or inbox-placement problems before they become crises. The professional move is to review all five metrics together on a weekly cadence, compare them against rolling four-week averages rather than single-week snapshots, and investigate any metric that drifts more than two standard deviations from its baseline. Benchmarks from industry reports provide useful context but are no substitute for your own historical baselines, because every list has its own engagement profile shaped by acquisition source, product category, and audience demographics. Over time, the real payoff of diligent measurement is compound improvement: a two-percent lift in open rate multiplied by a one-percent lift in click rate multiplied by a half-percent lift in conversion rate produces a noticeably larger revenue-per-send number at the end of the quarter, and these small wins add up across hundreds of campaigns in a way that no single clever subject line ever could. Deliverability is the silent prerequisite that makes all of this possible, because if mailbox providers route your sends to the spam folder none of the downstream numbers mean anything, so authentication, list hygiene, and engagement-based sending practices deserve at least as much attention as creative optimization. Segmentation and automation multiply the return on every other investment by ensuring that the right message reaches the right person at the right moment, and a program that combines careful measurement with thoughtful targeting will outperform a louder, broader program every single time. Practical teams build this discipline through a small number of recurring rituals rather than one-off heroics. Weekly campaign reviews pair the sender, the analyst, and the designer in front of the same dashboard, focusing on what moved, what did not, and what to test next, with every observation captured in a shared document that accumulates institutional knowledge instead of evaporating after the meeting ends. Monthly deliverability audits inspect authentication records, bounce trends, and complaint rates, catching reputation issues while they are still cheap to fix. Quarterly strategy reviews step back from individual campaigns to ask harder questions about the overall program: is the sending cadence right, is the audience growing healthily, is the content still aligned with the promises made at signup, and are the business outcomes trending in the right direction. None of these rituals require sophisticated tooling, but they do require the discipline to protect the time and the humility to act on uncomfortable findings. Teams that sustain this discipline build programs that continue to perform year after year even as channels fragment and attention becomes scarcer. The ones that skip the rituals end up chasing short-term metrics, burning their lists, and eventually rebuilding from scratch. Beyond the rituals themselves, the mindset behind them matters enormously. Email is a channel that rewards patience and punishes impatience, because short-term tactics that juice a single campaign often damage the relationship with the underlying audience in ways that take months to repair. A flashy subject line that lifts open rate by three points but trains recipients to distrust future messages is a net loss, even though the weekly dashboard celebrates it. A heavy discount promotion that drives a spike in revenue but conditions the list to wait for the next sale is similarly a loss, spread over quarters rather than weeks. Professional programs learn to identify these hidden tradeoffs and optimize for the lifetime value of the subscriber rather than the performance of any single send. That reframing also changes how teams handle underperformers: rather than punishing a campaign that missed its numbers, they treat it as a data point in an ongoing experiment, extracting the lesson and moving forward without drama. Organizational maturity shows up in small behaviors like these. Executives who understand email as a long-term relationship asset rather than a quarterly revenue lever give their teams the runway to build something durable, and those teams in turn build the trust with subscribers that keeps the channel performing even as inboxes grow more crowded and more filtered. Over a five-year horizon, the programs that win are almost never the ones with the cleverest individual campaigns; they are the ones that maintained consistency, respected the subscriber, measured honestly, and iterated patiently.`;

interface TestCase {
  name: string;
  text: string;
  minChunks: number;
  maxChunks: number;
}

const TESTS: TestCase[] = [
  { name: "short text (single chunk)", text: TEST_1, minChunks: 1, maxChunks: 1 },
  { name: "medium text (multi-paragraph)", text: TEST_2, minChunks: 2, maxChunks: 4 },
  { name: "long text (many paragraphs)", text: TEST_3, minChunks: 5, maxChunks: 12 },
  { name: "massive single paragraph (sentence fallback)", text: TEST_4, minChunks: 3, maxChunks: 20 },
];

function preview(chunk: Chunk): string {
  const content = chunk.content;
  if (content.length <= 120) return content.replace(/\s+/g, " ");
  const head = content.slice(0, 80).replace(/\s+/g, " ");
  const tail = content.slice(-40).replace(/\s+/g, " ");
  return `${head}...${tail}`;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, " ");
}

function runTest(testNumber: number, t: TestCase): boolean {
  console.log(`=== Test ${testNumber}: ${t.name} ===`);
  const chunks = chunkText(t.text);
  const inputLen = t.text.length;
  const outputLen = chunks.reduce((sum, c) => sum + c.content.length, 0);

  console.log(
    `chunks=${pad(chunks.length, 3)}  input_len=${pad(inputLen, 6)}  output_len=${pad(outputLen, 6)}  delta=${pad(inputLen - outputLen, 5)}`,
  );

  for (const c of chunks) {
    console.log(
      `  [${pad(c.chunkIndex, 2)}] tokens=${pad(c.tokenCount, 4)}  ${preview(c)}`,
    );
  }

  const ceiling = Math.floor(DEFAULT_CHUNK_OPTIONS.maxTokens * 1.3);
  const failures: string[] = [];

  if (chunks.length < t.minChunks || chunks.length > t.maxChunks) {
    failures.push(
      `expected ${t.minChunks}-${t.maxChunks} chunks, got ${chunks.length}`,
    );
  }
  for (const c of chunks) {
    if (c.content.length === 0) failures.push(`chunk ${c.chunkIndex} is empty`);
    if (c.tokenCount > ceiling) {
      failures.push(
        `chunk ${c.chunkIndex} tokenCount=${c.tokenCount} exceeds ceiling ${ceiling}`,
      );
    }
  }
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i]!.chunkIndex !== i) {
      failures.push(`chunk at position ${i} has chunkIndex=${chunks[i]!.chunkIndex}`);
    }
  }
  // Sanity check: token count matches approxTokenCount of content.
  for (const c of chunks) {
    const recomputed = approxTokenCount(c.content);
    if (recomputed !== c.tokenCount) {
      failures.push(
        `chunk ${c.chunkIndex} tokenCount=${c.tokenCount} != approxTokenCount=${recomputed}`,
      );
    }
  }

  if (failures.length === 0) {
    console.log(`-> PASS\n`);
    return true;
  }
  for (const f of failures) console.log(`  ! ${f}`);
  console.log(`-> FAIL\n`);
  return false;
}

function main(): void {
  let passed = 0;
  TESTS.forEach((t, i) => {
    if (runTest(i + 1, t)) passed += 1;
  });
  const total = TESTS.length;
  console.log("============================================");
  console.log(`Results: ${passed}/${total} passed`);
  if (passed === total) {
    console.log("OVERALL: PASS");
    process.exit(0);
  }
  console.log("OVERALL: FAIL");
  process.exit(1);
}

main();
