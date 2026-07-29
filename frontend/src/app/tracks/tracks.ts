import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from "@angular/core";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-tracks",
  templateUrl: "./tracks.html",
  styleUrls: ["./tracks.scss"],
})
export class Tracks implements OnInit, OnDestroy {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private readonly songService = inject(SongService);
  private objectUrl: string | null = null;

  readonly songs = signal<Song[]>([]);
  readonly selectedSongId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly loadedDuration = signal(0);
  readonly streamObjectUrl = signal("");
  readonly searchQuery = signal("");
  readonly volume = signal(0.75);
  readonly shuffleEnabled = signal(false);
  readonly repeatEnabled = signal(false);

  readonly selectedSong = computed(() => {
    const selectedId = this.selectedSongId();
    return this.songs().find((song) => song.id === selectedId) ?? null;
  });

  readonly activeDuration = computed(() => {
    const loadedDuration = this.loadedDuration();
    const apiDuration = this.selectedSong()?.duration ?? 0;
    return loadedDuration > 0 ? loadedDuration : apiDuration;
  });

  readonly filteredSongs = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.songs();
    }

    return this.songs().filter((song) =>
      [song.title, song.artist, song.album].some((value) =>
        value.toLocaleLowerCase().includes(query),
      ),
    );
  });

  readonly greeting = this.createGreeting();

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
        await this.selectSong(songs[0]);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to load songs.");
    } finally {
      this.loading.set(false);
    }
  }

  async selectSong(song: Song): Promise<void> {
    if (song.id === this.selectedSongId() && this.streamObjectUrl()) {
      return;
    }

    this.selectedSongId.set(song.id);
    this.resetPlaybackState();

    try {
      const objectUrl = await this.songService.createAuthenticatedStreamUrl(song.id);
      this.revokeObjectUrl();
      this.objectUrl = objectUrl;
      this.streamObjectUrl.set(objectUrl);
      queueMicrotask(() => this.audioElement()?.load());
    } catch (error) {
      this.streamObjectUrl.set("");
      this.error.set(error instanceof Error ? error.message : "Unable to prepare audio playback.");
    }
  }

  async playSelectedSong(): Promise<void> {
    const audio = this.audioElement();

    if (!audio || !this.selectedSong() || !this.streamObjectUrl()) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        this.isPlaying.set(true);
        this.error.set(null);
      } catch {
        this.error.set("Playback could not start. Check that the audio file is available.");
      }
    } else {
      audio.pause();
      this.isPlaying.set(false);
    }
  }

  async playSong(song: Song): Promise<void> {
    await this.selectSong(song);
    queueMicrotask(() => {
      void this.playSelectedSong();
    });
  }

  async previousTrack(): Promise<void> {
    const songs = this.songs();
    const currentSong = this.selectedSong();
    const audio = this.audioElement();

    if (!currentSong || songs.length === 0) {
      return;
    }

    if (audio && audio.currentTime > 3) {
      this.seekTo(0);
      return;
    }

    const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
    const previousIndex = Math.max(currentIndex - 1, 0);
    const wasPlaying = this.isPlaying();

    await this.selectSong(songs[previousIndex]);

    if (wasPlaying) {
      queueMicrotask(() => {
        void this.playSelectedSong();
      });
    }
  }

  rewind(seconds = 10): void {
    const audio = this.audioElement();

    if (!audio) {
      return;
    }

    this.seekTo(Math.max(audio.currentTime - seconds, 0));
  }

  async nextTrack(): Promise<void> {
    const songs = this.songs();
    const currentSong = this.selectedSong();

    if (!currentSong || songs.length === 0) {
      return;
    }

    const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
    const nextIndex = this.shuffleEnabled()
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex + 1) % songs.length;
    const shouldPlay = this.isPlaying();

    await this.selectSong(songs[nextIndex]);

    if (shouldPlay) {
      queueMicrotask(() => {
        void this.playSelectedSong();
      });
    }
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setVolume(event: Event): void {
    const volume = Number((event.target as HTMLInputElement).value);
    this.volume.set(volume);

    const audio = this.audioElement();
    if (audio) {
      audio.volume = volume;
    }
  }

  toggleShuffle(): void {
    this.shuffleEnabled.update((enabled) => !enabled);
  }

  toggleRepeat(): void {
    this.repeatEnabled.update((enabled) => !enabled);
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
    if (this.repeatEnabled()) {
      this.seekTo(0);
      void this.playSelectedSong();
      return;
    }

    void this.nextTrack();
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

  private createGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }
}
