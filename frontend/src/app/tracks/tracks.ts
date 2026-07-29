import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { Playlist, PlaylistApiError, PlaylistService } from "../playlistservice";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-tracks",
  imports: [RouterLink],
  templateUrl: "./tracks.html",
  styleUrls: ["./tracks.scss"],
})
export class Tracks implements OnInit, OnDestroy {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private readonly songService = inject(SongService);
  private readonly playlistService = inject(PlaylistService);
  private objectUrl: string | null = null;

  readonly songs = signal<Song[]>([]);
  readonly selectedSongId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly loadedDuration = signal(0);
  readonly streamObjectUrl = signal("");
  readonly actionMenuSongId = signal<string | null>(null);
  readonly playlists = signal<Playlist[]>([]);
  readonly playlistsLoading = signal(false);
  readonly addingToPlaylistId = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly selectedSong = computed(() => {
    const selectedId = this.selectedSongId();
    return this.songs().find((song) => song.id === selectedId) ?? null;
  });

  readonly activeDuration = computed(() => {
    const loadedDuration = this.loadedDuration();
    const apiDuration = this.selectedSong()?.duration ?? 0;
    return loadedDuration > 0 ? loadedDuration : apiDuration;
  });

  async ngOnInit(): Promise<void> {
    await this.loadSongs();
  }

  @HostListener("document:keydown.escape")
  closeActionMenu(): void {
    this.actionMenuSongId.set(null);
  }

  @HostListener("document:click")
  closeActionMenuFromOutside(): void {
    this.closeActionMenu();
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

  async toggleActionMenu(song: Song, event: Event): Promise<void> {
    event.stopPropagation();
    this.actionMessage.set(null);
    this.actionError.set(null);

    if (this.actionMenuSongId() === song.id) {
      this.closeActionMenu();
      return;
    }

    this.actionMenuSongId.set(song.id);
    if (this.playlists().length === 0) {
      await this.loadPlaylistsForMenu();
    }
  }

  keepActionMenuOpen(event: Event): void {
    event.stopPropagation();
  }

  async addSongToPlaylist(song: Song, playlist: Playlist): Promise<void> {
    if (this.addingToPlaylistId()) {
      return;
    }

    this.addingToPlaylistId.set(playlist.id);
    this.actionMessage.set(null);
    this.actionError.set(null);

    try {
      const updated = await this.playlistService.addSong(playlist.id, song.id);
      this.playlists.update((items) =>
        items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      this.actionMessage.set(`Added “${song.title || "Untitled song"}” to ${playlist.name}.`);
      this.closeActionMenu();
    } catch (error) {
      this.actionError.set(
        error instanceof PlaylistApiError && error.status === 409
          ? "Song is already in this playlist."
          : error instanceof Error
            ? error.message
            : "Unable to add this song to the playlist.",
      );
    } finally {
      this.addingToPlaylistId.set(null);
    }
  }

  private async loadPlaylistsForMenu(): Promise<void> {
    this.playlistsLoading.set(true);

    try {
      this.playlists.set(await this.playlistService.list());
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : "Unable to load your playlists.",
      );
    } finally {
      this.playlistsLoading.set(false);
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
