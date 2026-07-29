import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from "@angular/core";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-tracks",
  templateUrl: "./tracks.html",
  styleUrls: ["./tracks.scss"],
})
export class Tracks implements OnInit {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private readonly songService = inject(SongService);

  readonly songs = signal<Song[]>([]);
  readonly selectedSongId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly loadedDuration = signal(0);

  readonly selectedSong = computed(() => {
    const selectedId = this.selectedSongId();
    return this.songs().find((song) => song.id === selectedId) ?? null;
  });

  readonly streamUrl = computed(() => {
    const song = this.selectedSong();
    return song ? this.songService.streamUrl(song.id) : "";
  });

  readonly activeDuration = computed(() => {
    const loadedDuration = this.loadedDuration();
    const apiDuration = this.selectedSong()?.duration ?? 0;
    return loadedDuration > 0 ? loadedDuration : apiDuration;
  });

  async ngOnInit(): Promise<void> {
    await this.loadSongs();
  }

  async loadSongs(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const songs = await this.songService.getAllSongs();
      this.songs.set(songs);

      if (songs.length > 0 && this.selectedSongId() === null) {
        this.selectedSongId.set(songs[0].id);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to load songs.");
    } finally {
      this.loading.set(false);
    }
  }

  selectSong(song: Song): void {
    if (song.id === this.selectedSongId()) {
      return;
    }

    this.selectedSongId.set(song.id);
    this.resetPlaybackState();
    queueMicrotask(() => this.audioElement()?.load());
  }

  async playSelectedSong(): Promise<void> {
    const audio = this.audioElement();

    if (!audio || !this.selectedSong()) {
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

    this.selectSong(songs[previousIndex]);

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
    this.isPlaying.set(false);
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

  private audioElement(): HTMLAudioElement | null {
    return this.audioPlayer?.nativeElement ?? null;
  }
}
