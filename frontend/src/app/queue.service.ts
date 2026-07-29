import { Injectable, computed, signal } from "@angular/core";
import { Song } from "./songservice";

export type QueueMode = "playlist" | "library";

const LIBRARY_QUEUE_LENGTH = 10;
const HISTORY_LIMIT = 20;

@Injectable({
  providedIn: "root",
})
export class QueueService {
  readonly mode = signal<QueueMode | null>(null);
  readonly source = signal<Song[]>([]);
  readonly queue = signal<Song[]>([]);
  readonly history = signal<Song[]>([]);
  readonly playlistTotal = signal(0);
  readonly playlistPosition = signal(0);

  private nextSourceIndex = 0;

  readonly currentSong = computed(() => this.queue()[0] ?? null);

  readonly hasNext = computed(() => {
    const mode = this.mode();
    if (mode === "library") {
      return this.source().length > 0;
    }
    if (mode === "playlist") {
      return this.queue().length > 1;
    }
    return false;
  });

  readonly hasPrevious = computed(() => this.history().length > 0);

  readonly positionLabel = computed(() => {
    const mode = this.mode();
    if (mode === "playlist") {
      const total = this.playlistTotal();
      if (total <= 0 || this.queue().length === 0) {
        return null;
      }
      return `${this.playlistPosition()} / ${total}`;
    }
    if (mode === "library" && this.queue().length > 0) {
      return `Library · ${this.queue().length} in queue`;
    }
    return null;
  });

  startFrom(songs: Song[], startIndex: number, mode: QueueMode): Song | null {
    if (songs.length === 0 || startIndex < 0 || startIndex >= songs.length) {
      this.clear();
      return null;
    }

    this.mode.set(mode);
    this.source.set(songs);
    this.history.set([]);

    if (mode === "playlist") {
      const slice = songs.slice(startIndex);
      this.queue.set(slice);
      this.playlistTotal.set(slice.length);
      this.playlistPosition.set(1);
      this.nextSourceIndex = 0;
      return slice[0] ?? null;
    }

    this.playlistTotal.set(0);
    this.playlistPosition.set(0);

    const window: Song[] = [];
    for (let i = 0; i < LIBRARY_QUEUE_LENGTH; i++) {
      window.push(songs[(startIndex + i) % songs.length]);
    }
    this.queue.set(window);
    this.nextSourceIndex = (startIndex + LIBRARY_QUEUE_LENGTH) % songs.length;
    return window[0] ?? null;
  }

  /** Advance past the current song. Returns the next song, or null if playback should stop. */
  advance(): Song | null {
    const queue = this.queue();
    if (queue.length === 0) {
      return null;
    }

    const [current, ...rest] = queue;
    this.pushHistory(current);

    if (this.mode() === "playlist") {
      this.queue.set(rest);
      if (rest.length === 0) {
        return null;
      }
      this.playlistPosition.update((position) => position + 1);
      return rest[0];
    }

    this.queue.set(rest);
    this.refill();
    return this.queue()[0] ?? null;
  }

  /** Move back to the previously played song. Returns that song, or the current song if none. */
  playPrevious(): Song | null {
    const history = this.history();
    const current = this.currentSong();

    if (history.length === 0) {
      return current;
    }

    const previous = history[history.length - 1];
    this.history.set(history.slice(0, -1));

    if (current) {
      const nextQueue = [previous, current, ...this.queue().slice(1)];
      this.queue.set(
        this.mode() === "library" ? nextQueue.slice(0, LIBRARY_QUEUE_LENGTH) : nextQueue,
      );
    } else {
      this.queue.set([previous]);
    }

    if (this.mode() === "playlist") {
      this.playlistPosition.update((position) => Math.max(1, position - 1));
    }

    return previous;
  }

  clear(): void {
    this.mode.set(null);
    this.source.set([]);
    this.queue.set([]);
    this.history.set([]);
    this.playlistTotal.set(0);
    this.playlistPosition.set(0);
    this.nextSourceIndex = 0;
  }

  private refill(): void {
    const source = this.source();
    if (source.length === 0 || this.mode() !== "library") {
      return;
    }

    const queue = [...this.queue()];
    while (queue.length < LIBRARY_QUEUE_LENGTH) {
      queue.push(source[this.nextSourceIndex % source.length]);
      this.nextSourceIndex = (this.nextSourceIndex + 1) % source.length;
    }
    this.queue.set(queue);
  }

  private pushHistory(song: Song): void {
    this.history.update((history) => {
      const next = [...history, song];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  }
}
