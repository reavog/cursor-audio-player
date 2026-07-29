import { Injectable, computed, inject, signal } from "@angular/core";
import { QueueItem, RepeatMode } from "../models/queue.model";
import { Song } from "../models/song.model";
import { SongService } from "./song.service";

@Injectable({
  providedIn: "root",
})
export class AudioPlayerService {
  private readonly songService = inject(SongService);

  private audioElement: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private queueIdCounter = 0;

  private readonly currentSongSignal = signal<Song | null>(null);
  private readonly isPlayingSignal = signal(false);
  private readonly currentTimeSignal = signal(0);
  private readonly durationSignal = signal(0);
  private readonly volumeSignal = signal(0.85);
  private readonly mutedSignal = signal(false);
  private readonly shuffleSignal = signal(false);
  private readonly repeatSignal = signal<RepeatMode>("off");
  private readonly queueSignal = signal<QueueItem[]>([]);
  private readonly queueIndexSignal = signal(-1);
  private readonly streamObjectUrlSignal = signal("");
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadingStreamSignal = signal(false);

  readonly currentSong = this.currentSongSignal.asReadonly();
  readonly isPlaying = this.isPlayingSignal.asReadonly();
  readonly currentTime = this.currentTimeSignal.asReadonly();
  readonly duration = this.durationSignal.asReadonly();
  readonly volume = this.volumeSignal.asReadonly();
  readonly muted = this.mutedSignal.asReadonly();
  readonly shuffle = this.shuffleSignal.asReadonly();
  readonly repeat = this.repeatSignal.asReadonly();
  readonly queue = this.queueSignal.asReadonly();
  readonly queueIndex = this.queueIndexSignal.asReadonly();
  readonly streamObjectUrl = this.streamObjectUrlSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly loadingStream = this.loadingStreamSignal.asReadonly();

  readonly queueCount = computed(() => this.queueSignal().length);
  readonly remainingDuration = computed(() => {
    const songsById = this.songLookup;
    const index = this.queueIndexSignal();
    const queue = this.queueSignal();
    let total = 0;

    for (let i = Math.max(index, 0); i < queue.length; i += 1) {
      const song = songsById.get(queue[i].songId);
      if (song) {
        total += song.duration;
      }
    }

    return total;
  });

  private songLookup = new Map<string, Song>();

  registerAudioElement(audio: HTMLAudioElement): void {
    this.audioElement = audio;
    audio.volume = this.volumeSignal();
    audio.muted = this.mutedSignal();
  }

  unregisterAudioElement(audio: HTMLAudioElement): void {
    if (this.audioElement === audio) {
      this.audioElement = null;
    }
  }

  rememberSongs(songs: Song[]): void {
    this.songLookup = new Map(songs.map((song) => [song.id, song]));
  }

  async playSong(song: Song, options?: { queue?: Song[]; startIndex?: number }): Promise<void> {
    if (options?.queue) {
      this.replaceQueue(options.queue, options.startIndex ?? options.queue.findIndex((item) => item.id === song.id));
    }

    await this.loadAndPlay(song);
  }

  async play(): Promise<void> {
    const audio = this.audioElement;
    if (!audio || !this.currentSongSignal() || !this.streamObjectUrlSignal()) {
      return;
    }

    try {
      await audio.play();
      this.isPlayingSignal.set(true);
      this.errorSignal.set(null);
    } catch {
      this.errorSignal.set("Playback could not start. Check that the audio file is available.");
      this.isPlayingSignal.set(false);
    }
  }

  pause(): void {
    this.audioElement?.pause();
    this.isPlayingSignal.set(false);
  }

  async togglePlayPause(): Promise<void> {
    if (this.isPlayingSignal()) {
      this.pause();
      return;
    }

    await this.play();
  }

  async next(): Promise<void> {
    const queue = this.queueSignal();
    if (queue.length === 0) {
      return;
    }

    const currentIndex = this.queueIndexSignal();
    let nextIndex = currentIndex + 1;

    if (this.shuffleSignal()) {
      nextIndex = this.pickShuffledIndex(currentIndex, queue.length);
    }

    if (nextIndex >= queue.length) {
      if (this.repeatSignal() === "all") {
        nextIndex = 0;
      } else {
        this.pause();
        return;
      }
    }

    await this.playQueueItemAt(nextIndex);
  }

  async previous(): Promise<void> {
    const audio = this.audioElement;
    const queue = this.queueSignal();
    const currentIndex = this.queueIndexSignal();

    if (audio && audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    if (queue.length === 0 || currentIndex <= 0) {
      this.seek(0);
      return;
    }

    await this.playQueueItemAt(currentIndex - 1);
  }

  seek(time: number): void {
    const audio = this.audioElement;
    if (!audio) {
      return;
    }

    const nextTime = Math.max(0, time);
    audio.currentTime = nextTime;
    this.currentTimeSignal.set(nextTime);
  }

  setVolume(volume: number): void {
    const nextVolume = Math.min(1, Math.max(0, volume));
    this.volumeSignal.set(nextVolume);
    if (this.audioElement) {
      this.audioElement.volume = nextVolume;
    }
    if (nextVolume > 0) {
      this.mutedSignal.set(false);
      if (this.audioElement) {
        this.audioElement.muted = false;
      }
    }
  }

  toggleMute(): void {
    const next = !this.mutedSignal();
    this.mutedSignal.set(next);
    if (this.audioElement) {
      this.audioElement.muted = next;
    }
  }

  toggleShuffle(): void {
    this.shuffleSignal.update((value) => !value);
  }

  cycleRepeat(): void {
    const order: RepeatMode[] = ["off", "all", "one"];
    const current = this.repeatSignal();
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.repeatSignal.set(next);
  }

  addToQueue(song: Song): void {
    this.songLookup.set(song.id, song);
    this.queueSignal.update((queue) => [...queue, this.createQueueItem(song.id)]);
  }

  removeFromQueue(queueId: string): void {
    const queue = this.queueSignal();
    const index = queue.findIndex((item) => item.queueId === queueId);
    if (index < 0) {
      return;
    }

    const nextQueue = queue.filter((item) => item.queueId !== queueId);
    this.queueSignal.set(nextQueue);

    const currentIndex = this.queueIndexSignal();
    if (index < currentIndex) {
      this.queueIndexSignal.set(currentIndex - 1);
    } else if (index === currentIndex) {
      this.queueIndexSignal.set(Math.min(currentIndex, nextQueue.length - 1));
    }
  }

  clearQueue(): void {
    this.queueSignal.set([]);
    this.queueIndexSignal.set(-1);
  }

  reorderQueue(fromIndex: number, toIndex: number): void {
    const queue = [...this.queueSignal()];
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= queue.length ||
      toIndex >= queue.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const [item] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, item);

    const currentIndex = this.queueIndexSignal();
    let nextIndex = currentIndex;

    if (currentIndex === fromIndex) {
      nextIndex = toIndex;
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      nextIndex = currentIndex - 1;
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      nextIndex = currentIndex + 1;
    }

    this.queueSignal.set(queue);
    this.queueIndexSignal.set(nextIndex);
  }

  async playQueueItem(queueId: string): Promise<void> {
    const index = this.queueSignal().findIndex((item) => item.queueId === queueId);
    if (index < 0) {
      return;
    }

    await this.playQueueItemAt(index);
  }

  replaceQueue(songs: Song[], startIndex = 0): void {
    songs.forEach((song) => this.songLookup.set(song.id, song));
    this.queueSignal.set(songs.map((song) => this.createQueueItem(song.id)));
    this.queueIndexSignal.set(
      songs.length === 0 ? -1 : Math.min(Math.max(startIndex, 0), songs.length - 1),
    );
  }

  onLoadedMetadata(audio: HTMLAudioElement): void {
    this.durationSignal.set(Number.isFinite(audio.duration) ? audio.duration : 0);
  }

  onTimeUpdate(audio: HTMLAudioElement): void {
    this.currentTimeSignal.set(audio.currentTime);
  }

  async onEnded(): Promise<void> {
    if (this.repeatSignal() === "one") {
      this.seek(0);
      await this.play();
      return;
    }

    this.isPlayingSignal.set(false);
    await this.next();
  }

  destroy(): void {
    this.pause();
    this.revokeObjectUrl();
  }

  private async playQueueItemAt(index: number): Promise<void> {
    const item = this.queueSignal()[index];
    if (!item) {
      return;
    }

    const song = this.songLookup.get(item.songId);
    if (!song) {
      return;
    }

    this.queueIndexSignal.set(index);
    await this.loadAndPlay(song);
  }

  private async loadAndPlay(song: Song): Promise<void> {
    this.currentSongSignal.set(song);
    this.resetPlaybackClock();
    this.errorSignal.set(null);

    if (!this.songService.isStreamableSongId(song.id)) {
      this.streamObjectUrlSignal.set("");
      this.errorSignal.set("This demo track is not streamable. Load songs from the API to play audio.");
      this.isPlayingSignal.set(false);
      return;
    }

    this.loadingStreamSignal.set(true);

    try {
      const objectUrl = await this.songService.createAuthenticatedStreamUrl(song.id);
      this.revokeObjectUrl();
      this.objectUrl = objectUrl;
      this.streamObjectUrlSignal.set(objectUrl);

      const audio = this.audioElement;
      if (audio) {
        audio.load();
        await this.play();
      }
    } catch (error) {
      this.streamObjectUrlSignal.set("");
      this.isPlayingSignal.set(false);
      this.errorSignal.set(
        error instanceof Error ? error.message : "Unable to prepare audio playback.",
      );
    } finally {
      this.loadingStreamSignal.set(false);
    }
  }

  private createQueueItem(songId: string): QueueItem {
    this.queueIdCounter += 1;
    return {
      queueId: `queue-${this.queueIdCounter}`,
      songId,
    };
  }

  private pickShuffledIndex(currentIndex: number, length: number): number {
    if (length <= 1) {
      return 0;
    }

    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * length);
    }
    return nextIndex;
  }

  private resetPlaybackClock(): void {
    this.isPlayingSignal.set(false);
    this.currentTimeSignal.set(0);
    this.durationSignal.set(0);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
