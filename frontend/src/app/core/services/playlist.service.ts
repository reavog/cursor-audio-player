import { Injectable, computed, inject, signal } from "@angular/core";
import { artworkColorForKey } from "../data/mock-songs.fallback";
import { buildMockPlaylists } from "../data/mock-playlists";
import { Playlist } from "../models/playlist.model";
import { Song } from "../models/song.model";
import { MusicLibraryService } from "./music-library.service";

const CUSTOM_PLAYLISTS_KEY = "melody.customPlaylists";

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
    const mocks = buildMockPlaylists(songIds);
    const customs = this.readCustomPlaylists();
    this.playlistsSignal.set([...mocks, ...customs]);
  }

  createPlaylist(name: string): Playlist | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const id = `custom-${Date.now()}`;
    const playlist: Playlist = {
      id,
      name: trimmed,
      description: "Created on this device.",
      songIds: [],
      artworkColor: artworkColorForKey(trimmed),
      songCount: 0,
    };

    this.playlistsSignal.update((current) => [...current, playlist]);
    this.persistCustomPlaylists();
    return playlist;
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

  private readCustomPlaylists(): Playlist[] {
    try {
      const raw = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as Playlist[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item) => typeof item?.id === "string" && item.id.startsWith("custom-"))
        .map((item) => ({
          id: item.id,
          name: String(item.name ?? "Untitled playlist"),
          description: item.description,
          songIds: Array.isArray(item.songIds) ? item.songIds.map(String) : [],
          artworkColor: item.artworkColor ?? artworkColorForKey(String(item.name ?? item.id)),
          songCount: Array.isArray(item.songIds) ? item.songIds.length : 0,
        }));
    } catch {
      return [];
    }
  }

  private persistCustomPlaylists(): void {
    const customs = this.playlistsSignal().filter((playlist) => playlist.id.startsWith("custom-"));
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(customs));
  }
}
