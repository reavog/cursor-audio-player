import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
} from "@angular/core";
import { AudioPlayerService } from "../../../core/services/audio-player.service";
import { MusicLibraryService } from "../../../core/services/music-library.service";
import { PlayerUiService } from "../../../core/services/player-ui.service";
import { formatDuration } from "../../../shared/utils/format-duration";
import { AlbumArtwork } from "../../../shared/components/album-artwork/album-artwork";
import { IconButton } from "../../../shared/components/icon-button/icon-button";

@Component({
  selector: "app-now-playing-bar",
  imports: [AlbumArtwork, IconButton],
  templateUrl: "./now-playing-bar.html",
  styleUrls: ["./now-playing-bar.scss"],
})
export class NowPlayingBar implements AfterViewInit, OnDestroy {
  @ViewChild("audioPlayer") private audioPlayer?: ElementRef<HTMLAudioElement>;

  private readonly player = inject(AudioPlayerService);
  private readonly library = inject(MusicLibraryService);
  private readonly playerUi = inject(PlayerUiService);

  readonly currentSong = computed(() => {
    const current = this.player.currentSong();
    if (!current) {
      return null;
    }

    return this.library.getSongById(current.id) ?? current;
  });
  readonly isPlaying = this.player.isPlaying;
  readonly currentTime = this.player.currentTime;
  readonly duration = this.player.duration;
  readonly volume = this.player.volume;
  readonly muted = this.player.muted;
  readonly shuffle = this.player.shuffle;
  readonly repeat = this.player.repeat;
  readonly streamObjectUrl = this.player.streamObjectUrl;
  readonly error = this.player.error;
  readonly queueCount = this.player.queueCount;
  readonly queueDrawerOpen = this.playerUi.queueDrawerOpen;

  readonly activeDuration = computed(() => {
    const loaded = this.duration();
    const apiDuration = this.currentSong()?.duration ?? 0;
    return loaded > 0 ? loaded : apiDuration;
  });

  readonly currentTimeLabel = computed(() => formatDuration(this.currentTime()));
  readonly durationLabel = computed(() => formatDuration(this.activeDuration()));
  readonly repeatIcon = computed(() => (this.repeat() === "one" ? "repeat_one" : "repeat"));

  ngAfterViewInit(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (audio) {
      this.player.registerAudioElement(audio);
    }
  }

  ngOnDestroy(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (audio) {
      this.player.unregisterAudioElement(audio);
    }
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

  toggleQueue(): void {
    this.playerUi.toggleQueueDrawer();
  }

  onLoadedMetadata(audio: HTMLAudioElement): void {
    this.player.onLoadedMetadata(audio);
  }

  onTimeUpdate(audio: HTMLAudioElement): void {
    this.player.onTimeUpdate(audio);
  }

  onEnded(): void {
    void this.player.onEnded();
  }
}
