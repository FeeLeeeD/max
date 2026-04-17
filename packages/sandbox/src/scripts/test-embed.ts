import {
  EMBEDDING_DIMENSION,
  cosineSimilarity,
  embedBatch,
} from "../embedder.js";

const sentences = {
  A: "How do I improve my email open rate?",
  B: "What are best practices for increasing open rates in campaigns?",
  C: "The weather in Tokyo is nice today.",
  D: "I enjoy eating pizza on weekends.",
} as const;

type Key = keyof typeof sentences;

function fmt(n: number): string {
  return n.toFixed(4);
}

async function main(): Promise<void> {
  const keys = Object.keys(sentences) as Key[];
  const texts = keys.map((k) => sentences[k]);

  const vectors = await embedBatch(texts);
  const byKey = Object.fromEntries(
    keys.map((k, i) => [k, vectors[i]!]),
  ) as Record<Key, number[]>;

  const dim = byKey.A.length;
  console.log(`\nEmbedding dimension: ${dim} (expected ${EMBEDDING_DIMENSION})`);
  console.log(
    `First 5 values of A: [${byKey.A.slice(0, 5).map(fmt).join(", ")}]\n`,
  );

  const pairs: Array<[Key, Key, string]> = [
    ["A", "B", "expected: HIGH — same topic"],
    ["A", "C", "expected: LOW — unrelated"],
    ["A", "D", "expected: LOW — unrelated"],
    ["C", "D", "expected: LOW-MEDIUM — both casual/unrelated topics"],
  ];

  const sims: Record<string, number> = {};
  console.log("Pairwise cosine similarities:");
  for (const [x, y, note] of pairs) {
    const s = cosineSimilarity(byKey[x], byKey[y]);
    sims[`${x}${y}`] = s;
    console.log(`  ${x} vs ${y}: ${fmt(s)}  (${note})`);
  }
  console.log("");

  const ab = sims.AB!;
  const ac = sims.AC!;
  const ad = sims.AD!;

  const pass = ab > 0.7 && ab > ac && ab > ad;

  if (pass) {
    console.log(
      `PASS: sim(A,B)=${fmt(ab)} > 0.7 and exceeds sim(A,C)=${fmt(ac)} and sim(A,D)=${fmt(ad)}.`,
    );
    process.exit(0);
  } else {
    console.log(
      `FAIL: expected sim(A,B) > 0.7 AND sim(A,B) > sim(A,C) AND sim(A,B) > sim(A,D). Got sim(A,B)=${fmt(ab)}, sim(A,C)=${fmt(ac)}, sim(A,D)=${fmt(ad)}.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
