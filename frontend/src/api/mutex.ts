// Minimal mutex used to make sure only one silent token-refresh
// happens at a time, even if several requests 401 simultaneously.
export class Mutex {
  private locked = false;
  private waiters: Array<() => void> = [];

  isLocked(): boolean {
    return this.locked;
  }

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.locked = true;
        resolve(() => this.release());
      });
    });
  }

  async waitForUnlock(): Promise<void> {
    if (!this.locked) return;
    return new Promise((resolve) => {
      this.waiters.push(resolve as () => void);
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}
