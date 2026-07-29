import { Injectable, computed, inject, signal } from "@angular/core";
import { buildMockPlaylists } from "../data/mock-playlists";
import { Playlist } from "../models/playlist.model";
import { Song } from "../models/song.model";
import { MusicLibraryService } from "./music-library.service";

@Injectable({
  providedIn: "root",
})
export class PlaylistService {
  private readonly library = inject(MusicLibraryService);

  private readonly playlistsSignal = signal<Playlist[]>([]);

  readonly playlists = this.playlistsSignal.asReadonly();
  readonly playlistCount = computed(() => this.playlistsSignal().length);

  syncFromLibrary(): void {
    const songIds = this.library.songs().map((song) => song.id);
    this.playlistsSignal.set(buildMockPlaylists(songIds));
  }

  getPlaylistById(playlistId: string): Playlist | null {
    return this.playlistsSignal().find((playlist) => playlist.id === playlistId) ?? null;
  }

  getPlaylistSongs(playlistId: string): Song[] {
    const playlist = this.getPlaylistById(playlistId);
    if (!playlist) {
      return [];
    }

    return playlist.songIds
      .map((songId) => this.library.getSongById(songId))
      .filter((song): song is Song => song !== null);
  }
}
