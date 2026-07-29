import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from "@angular/core";
import { QueueService } from "../queue.service";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-tracks",
  templateUrl: "./tracks.html",
  styleUrls: ["./tracks.scss"],
})
export class Tracks implements OnInit, OnDestroy {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private readonly songService = inject(SongService);
  private readonly queueService = inject(QueueService);
  private objectUrl: string | null = null;

  readonly songs = signal<Song[]>([]);
  readonly selectedSongId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly loadedDuration = signal(0);
  readonly streamObjectUrl = signal("");

  readonly selectedSong = computed(() => {
    const selectedId = this.selectedSongId();
    return this.songs().find((song) => song.id === selectedId) ?? null;
  });

  readonly positionLabel = this.queueService.positionLabel;
  readonly hasNext = this.queueService.hasNext;
  readonly queue = this.queueService.queue;

  readonly activeDuration = computed(() => {
    const loadedDuration = this.loadedDuration();
    const apiDuration = this.selectedSong()?.duration ?? 0;
    return loadedDuration > 0 ? loadedDuration : apiDuration;
  });

  async ngOnInit(): Promise<void> {
    await this.loadSongs();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  async loadSongs(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const songs = await this.songService.getAllSongs();
      this.songs.set(songs);

      if (songs.length > 0 && this.selectedSongId() === null) {
        await this.prepareSong(songs[0]);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to load songs.");
    } finally {
      this.loading.set(false);
    }
  }

  async startSongAt(song: Song, index: number): Promise<void> {
    const started = this.queueService.startFrom(this.songs(), index, "library");
    if (!started) {
      return;
    }

    await this.prepareSong(started);
    await this.playCurrent(true);
  }

  async playSelectedSong(): Promise<void> {
    const audio = this.audioElement();
    const selected = this.selectedSong();

    if (!selected) {
      return;
    }

    if (!this.queueService.currentSong()) {
      const index = this.songs().findIndex((song) => song.id === selected.id);
      if (index < 0) {
        return;
      }
      this.queueService.startFrom(this.songs(), index, "library");
      await this.prepareSong(selected);
    }

    if (!audio || !this.streamObjectUrl()) {
      return;
    }

    if (audio.paused) {
      await this.playCurrent(true);
    } else {
      audio.pause();
      this.isPlaying.set(false);
    }
  }

  async previousTrack(): Promise<void> {
    const currentSong = this.selectedSong();
    const audio = this.audioElement();

    if (!currentSong) {
      return;
    }

    if (audio && audio.currentTime > 3) {
      this.seekTo(0);
      return;
    }

    if (!this.queueService.currentSong()) {
      const songs = this.songs();
      const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
      const previousIndex = Math.max(currentIndex - 1, 0);
      const wasPlaying = this.isPlaying();
      await this.prepareSong(songs[previousIndex]);
      if (wasPlaying) {
        await this.playCurrent(true);
      }
      return;
    }

    if (!this.queueService.hasPrevious()) {
      this.seekTo(0);
      return;
    }

    const wasPlaying = this.isPlaying();
    const previous = this.queueService.playPrevious();
    if (!previous) {
      return;
    }

    await this.prepareSong(previous);
    if (wasPlaying) {
      await this.playCurrent(true);
    }
  }

  async nextTrack(): Promise<void> {
    if (!this.queueService.currentSong()) {
      const selected = this.selectedSong();
      if (!selected) {
        return;
      }
      const index = this.songs().findIndex((song) => song.id === selected.id);
      if (index < 0) {
        return;
      }
      this.queueService.startFrom(this.songs(), index, "library");
    }

    if (!this.queueService.hasNext()) {
      this.isPlaying.set(false);
      return;
    }

    const next = this.queueService.advance();
    if (!next) {
      this.isPlaying.set(false);
      return;
    }

    await this.prepareSong(next);
    await this.playCurrent(true);
  }

  rewind(seconds = 10): void {
    const audio = this.audioElement();

    if (!audio) {
      return;
    }

    this.seekTo(Math.max(audio.currentTime - seconds, 0));
  }

  seek(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.seekTo(Number(input.value));
  }

  onLoadedMetadata(audio: HTMLAudioElement): void {
    this.loadedDuration.set(Number.isFinite(audio.duration) ? audio.duration : 0);
  }

  onTimeUpdate(audio: HTMLAudioElement): void {
    this.currentTime.set(audio.currentTime);
  }

  onEnded(): void {
    void this.advanceOnEnd();
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0:00";
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  private async advanceOnEnd(): Promise<void> {
    if (!this.queueService.currentSong()) {
      this.isPlaying.set(false);
      return;
    }

    const next = this.queueService.advance();
    if (!next) {
      this.isPlaying.set(false);
      return;
    }

    await this.prepareSong(next);
    await this.playCurrent(true);
  }

  private async prepareSong(song: Song): Promise<void> {
    if (song.id === this.selectedSongId() && this.streamObjectUrl()) {
      this.seekTo(0);
      return;
    }

    this.selectedSongId.set(song.id);
    this.resetPlaybackState();

    try {
      const objectUrl = await this.songService.createAuthenticatedStreamUrl(song.id);
      this.revokeObjectUrl();
      this.objectUrl = objectUrl;
      this.streamObjectUrl.set(objectUrl);
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          this.audioElement()?.load();
          resolve();
        });
      });
    } catch (error) {
      this.streamObjectUrl.set("");
      this.error.set(error instanceof Error ? error.message : "Unable to prepare audio playback.");
    }
  }

  private async playCurrent(forcePlay: boolean): Promise<void> {
    const audio = this.audioElement();

    if (!audio || !this.selectedSong() || !this.streamObjectUrl()) {
      return;
    }

    if (!forcePlay && !audio.paused) {
      return;
    }

    try {
      await audio.play();
      this.isPlaying.set(true);
      this.error.set(null);
    } catch {
      this.isPlaying.set(false);
      this.error.set("Playback could not start. Check that the audio file is available.");
    }
  }

  private seekTo(time: number): void {
    const audio = this.audioElement();

    if (!audio) {
      return;
    }

    audio.currentTime = time;
    this.currentTime.set(time);
  }

  private resetPlaybackState(): void {
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.loadedDuration.set(0);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private audioElement(): HTMLAudioElement | null {
    return this.audioPlayer?.nativeElement ?? null;
  }
}
