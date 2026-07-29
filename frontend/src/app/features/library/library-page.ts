import { Component, OnInit, inject } from "@angular/core";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { MusicLibraryService } from "../../core/services/music-library.service";
import { Song } from "../../core/models/song.model";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { IconButton } from "../../shared/components/icon-button/icon-button";
import { LoadingState } from "../../shared/components/loading-state/loading-state";
import { SongRow } from "../../shared/components/song-row/song-row";

@Component({
  selector: "app-library-page",
  imports: [EmptyState, IconButton, LoadingState, SongRow],
  templateUrl: "./library-page.html",
  styleUrls: ["./library-page.scss"],
})
export class LibraryPage implements OnInit {
  private readonly library = inject(MusicLibraryService);
  private readonly player = inject(AudioPlayerService);

  readonly songs = this.library.songs;
  readonly loading = this.library.loading;
  readonly error = this.library.error;
  readonly songCount = this.library.songCount;
  readonly usingFallback = this.library.usingFallback;
  readonly currentSong = this.player.currentSong;
  readonly isPlaying = this.player.isPlaying;

  async ngOnInit(): Promise<void> {
    if (this.songs().length === 0 && !this.loading()) {
      await this.library.loadSongs();
      this.player.rememberSongs(this.songs());
    }
  }

  async refresh(): Promise<void> {
    await this.library.loadSongs();
    this.player.rememberSongs(this.songs());
  }

  async playAll(): Promise<void> {
    const songs = this.songs();
    if (songs.length === 0) {
      return;
    }

    await this.player.playSong(songs[0], { queue: songs, startIndex: 0 });
  }

  async playSong(song: Song): Promise<void> {
    const songs = this.songs();
    const startIndex = songs.findIndex((item) => item.id === song.id);
    await this.player.playSong(song, {
      queue: songs,
      startIndex: startIndex >= 0 ? startIndex : 0,
    });
  }

  toggleFavorite(song: Song): void {
    this.library.toggleFavorite(song.id);
  }
}
