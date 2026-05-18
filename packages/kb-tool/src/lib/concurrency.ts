export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  const queue = [...items];

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        await fn(item);
      } catch (err) {
        // fn is responsible for its own error handling and state updates.
        // We log here so a swallowed exception still surfaces in devtools.
        console.error('Worker error:', err);
      }
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < limit; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}
