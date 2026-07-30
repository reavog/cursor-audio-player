import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { MusicLibraryService } from "../../core/services/music-library.service";
import { PlaylistService } from "../../core/services/playlist.service";
import { Song } from "../../core/models/song.model";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { SongRow } from "../../shared/components/song-row/song-row";

@Component({
  selector: "app-playlist-detail-page",
  imports: [EmptyState, RouterLink, SongRow],
  templateUrl: "./playlist-detail-page.html",
  styleUrls: ["./playlist-detail-page.scss"],
})
export class PlaylistDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly playlistService = inject(PlaylistService);
  private readonly library = inject(MusicLibraryService);
  private readonly player = inject(AudioPlayerService);

  private readonly playlistId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("id") ?? "")),
    { initialValue: "" },
  );

  readonly playlist = computed(() => this.playlistService.getPlaylistById(this.playlistId()));
  readonly songs = computed(() => this.playlistService.getPlaylistSongs(this.playlistId()));
  readonly currentSong = this.player.currentSong;
  readonly isPlaying = this.player.isPlaying;

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
