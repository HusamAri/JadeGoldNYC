type Entry<T> = { value: T; expiresAt: number } | { pending: Promise<T> };

/** Small process-memory cache for complete pinned values; never stores a loader or its credentials. */
export class PinnedMemoryCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  constructor(private readonly options: {
    ttlMs: number; maxKeys: number; accept: (value: T) => boolean; now?: () => number;
  }) {
    if (!Number.isSafeInteger(options.ttlMs) || options.ttlMs <= 0 || !Number.isSafeInteger(options.maxKeys) || options.maxKeys <= 0) {
      throw new Error("Cache TTL and key bound must be positive integers.");
    }
  }
  private now() { return (this.options.now ?? Date.now)(); }
  async get(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing && "pending" in existing) return existing.pending;
    if (existing && existing.expiresAt > this.now()) {
      this.entries.delete(key); this.entries.set(key, existing);
      return existing.value;
    }
    this.entries.delete(key);
    while (this.entries.size >= this.options.maxKeys) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    const pending = Promise.resolve().then(loader).then((value) => {
      if (this.entries.get(key) === entry) {
        if (this.options.accept(value)) this.entries.set(key, { value, expiresAt: this.now() + this.options.ttlMs });
        else this.entries.delete(key);
      }
      return value;
    }).catch((error: unknown) => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
      throw error;
    });
    const entry: Entry<T> = { pending }; this.entries.set(key, entry);
    return pending;
  }
}
