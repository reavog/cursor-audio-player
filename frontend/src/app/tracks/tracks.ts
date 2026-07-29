import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from "@angular/core";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-tracks",
  templateUrl: "./tracks.html",
  styleUrls: ["./tracks.scss"],
})
export class Tracks implements OnInit, OnDestroy {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private static readonly SEARCH_DELAY_MS = 300;
  private static readonly PAGE_SIZE = 25;

  private readonly songService = inject(SongService);
  private objectUrl: string | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private searchController: AbortController | null = null;
  private searchRequestId = 0;
  private selectionRequestId = 0;
  private hasLoaded = false;

  readonly songs = signal<Song[]>([]);
  readonly selectedSong = signal<Song | null>(null);
  readonly searchQuery = signal("");
  readonly activeQuery = signal("");
  readonly currentPage = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly isFirstPage = signal(true);
  readonly isLastPage = signal(true);
  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly catalogError = signal<string | null>(null);
  readonly playbackError = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly loadedDuration = signal(0);
  readonly streamObjectUrl = signal("");

  readonly selectedSongId = computed(() => this.selectedSong()?.id ?? null);
  readonly selectedSongInCurrentPage = computed(() => {
    const selectedId = this.selectedSongId();
    return selectedId !== null && this.songs().some((song) => song.id === selectedId);
  });

  readonly activeDuration = computed(() => {
    const loadedDuration = this.loadedDuration();
    const apiDuration = this.selectedSong()?.duration ?? 0;
    return loadedDuration > 0 ? loadedDuration : apiDuration;
  });

  async ngOnInit(): Promise<void> {
    await this.loadSongs();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchController?.abort();
    this.selectionRequestId += 1;
    this.revokeObjectUrl();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      void this.loadSongs(0);
    }, Tracks.SEARCH_DELAY_MS);
  }

  clearSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.searchQuery.set("");
    void this.loadSongs(0);
  }

  async loadSongs(page = this.currentPage()): Promise<void> {
    const requestId = ++this.searchRequestId;
    const query = this.searchQuery().trim();
    this.searchController?.abort();
    this.searchController = new AbortController();
    this.activeQuery.set(query);
    this.catalogError.set(null);
    this.loading.set(!this.hasLoaded);
    this.searching.set(this.hasLoaded);

    try {
      const result = await this.songService.getSongs(
        query,
        page,
        Tracks.PAGE_SIZE,
        this.searchController.signal,
      );

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.songs.set(result.content);
      this.currentPage.set(result.page);
      this.totalElements.set(result.totalElements);
      this.totalPages.set(result.totalPages);
      this.isFirstPage.set(result.first);
      this.isLastPage.set(result.last);

      if (result.content.length > 0 && this.selectedSong() === null) {
        await this.selectSong(result.content[0]);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (requestId === this.searchRequestId) {
        this.catalogError.set(error instanceof Error ? error.message : "Unable to load songs.");
      }
    } finally {
      if (requestId === this.searchRequestId) {
        this.hasLoaded = true;
        this.loading.set(false);
        this.searching.set(false);
      }
    }
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.currentPage()) {
      return;
    }

    void this.loadSongs(page);
  }

  async selectSong(song: Song): Promise<void> {
    if (song.id === this.selectedSongId() && this.streamObjectUrl()) {
      return;
    }

    const requestId = ++this.selectionRequestId;
    this.selectedSong.set(song);
    this.playbackError.set(null);
    this.resetPlaybackState();

    try {
      const objectUrl = await this.songService.createAuthenticatedStreamUrl(song.id);

      if (requestId !== this.selectionRequestId) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      this.revokeObjectUrl();
      this.objectUrl = objectUrl;
      this.streamObjectUrl.set(objectUrl);
      queueMicrotask(() => this.audioElement()?.load());
    } catch (error) {
      if (requestId === this.selectionRequestId) {
        this.streamObjectUrl.set("");
        this.playbackError.set(
          error instanceof Error ? error.message : "Unable to prepare audio playback.",
        );
      }
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
        this.playbackError.set(null);
      } catch {
        this.playbackError.set("Playback could not start. Check that the audio file is available.");
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

    if (!currentSong || songs.length === 0 || !this.selectedSongInCurrentPage()) {
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
