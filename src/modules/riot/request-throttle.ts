export class RequestThrottle {
  private queue: Promise<void> = Promise.resolve();
  private nextSlot = 0;

  constructor(private readonly spacingMs: number) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.nextSlot - Date.now();
      if (wait > 0) {
        await sleep(wait);
      }
      this.nextSlot = Date.now() + this.spacingMs;
    });
    this.queue = run.catch(() => undefined);
    return run.then(task);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
