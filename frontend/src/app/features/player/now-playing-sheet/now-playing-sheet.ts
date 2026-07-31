import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
} from "@angular/core";
import { AudioPlayerService } from "../../../core/services/audio-player.service";
import { MusicLibraryService } from "../../../core/services/music-library.service";
import { PlayerUiService } from "../../../core/services/player-ui.service";
import { formatDuration } from "../../../shared/utils/format-duration";
import { trapFocus } from "../../../shared/utils/trap-focus";
import { AlbumArtwork } from "../../../shared/components/album-artwork/album-artwork";
import { IconButton } from "../../../shared/components/icon-button/icon-button";

@Component({
  selector: "app-now-playing-sheet",
  imports: [AlbumArtwork, IconButton],
  templateUrl: "./now-playing-sheet.html",
  styleUrls: ["./now-playing-sheet.scss"],
})
export class NowPlayingSheet implements AfterViewInit, OnDestroy {
  @ViewChild("sheetRoot") private sheetRoot?: ElementRef<HTMLElement>;
  @ViewChild("closeButton") private closeButton?: ElementRef<HTMLButtonElement>;

  private readonly player = inject(AudioPlayerService);
  private readonly library = inject(MusicLibraryService);
  private readonly playerUi = inject(PlayerUiService);

  private releaseTrap: (() => void) | null = null;
  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  readonly open = this.playerUi.nowPlayingSheetOpen;
  readonly isPlaying = this.player.isPlaying;
  readonly currentTime = this.player.currentTime;
  readonly duration = this.player.duration;
  readonly volume = this.player.volume;
  readonly muted = this.player.muted;
  readonly shuffle = this.player.shuffle;
  readonly repeat = this.player.repeat;
  readonly queueCount = this.player.queueCount;
  readonly error = this.player.error;

  readonly currentSong = computed(() => {
    const current = this.player.currentSong();
    if (!current) {
      return null;
    }

    return this.library.getSongById(current.id) ?? current;
  });

  readonly activeDuration = computed(() => {
    const loaded = this.duration();
    const apiDuration = this.currentSong()?.duration ?? 0;
    return loaded > 0 ? loaded : apiDuration;
  });

  readonly currentTimeLabel = computed(() => formatDuration(this.currentTime()));
  readonly durationLabel = computed(() => formatDuration(this.activeDuration()));
  readonly repeatIcon = computed(() => (this.repeat() === "one" ? "repeat_one" : "repeat"));

  readonly seekValueText = computed(() => {
    if (!this.currentSong()) {
      return "No song selected";
    }

    return `${this.currentTimeLabel()} of ${this.durationLabel()}`;
  });

  readonly volumeValueText = computed(() => {
    if (this.muted() || this.volume() === 0) {
      return "Muted";
    }

    return `${Math.round(this.volume() * 100)} percent`;
  });

  readonly shuffleLabel = computed(() => (this.shuffle() ? "Shuffle on" : "Shuffle off"));

  readonly repeatLabel = computed(() => {
    switch (this.repeat()) {
      case "all":
        return "Repeat all";
      case "one":
        return "Repeat one";
      default:
        return "Repeat off";
    }
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();

      if (isOpen && !this.wasOpen) {
        this.previousFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.body.classList.add("melody-overlay-open");
        queueMicrotask(() => {
          this.closeButton?.nativeElement.focus();
          this.attachTrap();
        });
      }

      if (!isOpen && this.wasOpen) {
        this.releaseTrap?.();
        this.releaseTrap = null;
        document.body.classList.remove("melody-overlay-open");
        queueMicrotask(() => this.previousFocus?.focus());
        this.previousFocus = null;
      }

      this.wasOpen = isOpen;
    });
  }

  ngAfterViewInit(): void {
    if (this.open()) {
      this.attachTrap();
    }
  }

  ngOnDestroy(): void {
    this.releaseTrap?.();
    document.body.classList.remove("melody-overlay-open");
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  close(): void {
    this.playerUi.closeNowPlayingSheet();
  }

  togglePlay(): void {
    void this.player.togglePlayPause();
  }

  previous(): void {
    void this.player.previous();
  }

  next(): void {
    void this.player.next();
  }

  seek(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.player.seek(Number(input.value));
  }

  setVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.player.setVolume(Number(input.value));
  }

  toggleMute(): void {
    this.player.toggleMute();
  }

  toggleShuffle(): void {
    this.player.toggleShuffle();
  }

  cycleRepeat(): void {
    this.player.cycleRepeat();
  }

  toggleFavorite(): void {
    const song = this.currentSong();
    if (song) {
      this.library.toggleFavorite(song.id);
    }
  }

  openQueue(): void {
    this.playerUi.closeNowPlayingSheet();
    this.playerUi.openQueueDrawer();
  }

  private attachTrap(): void {
    this.releaseTrap?.();
    const root = this.sheetRoot?.nativeElement;
    if (root) {
      this.releaseTrap = trapFocus(root);
    }
  }
}
