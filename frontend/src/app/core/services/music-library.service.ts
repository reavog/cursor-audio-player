import { Injectable, computed, inject, signal } from "@angular/core";
import { FALLBACK_SONGS, artworkColorForKey } from "../data/mock-songs.fallback";
import { Song } from "../models/song.model";
import { SongService } from "./song.service";

const FAVORITES_STORAGE_KEY = "melody.favoriteSongIds";

@Injectable({
  providedIn: "root",
})
export class MusicLibraryService {
  private readonly songService = inject(SongService);

  private readonly songsSignal = signal<Song[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly usingFallbackSignal = signal(false);
  private readonly favoriteIdsSignal = signal<Set<string>>(this.readFavoriteIds());

  readonly songs = this.songsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly usingFallback = this.usingFallbackSignal.asReadonly();
  readonly songCount = computed(() => this.songsSignal().length);

  async loadSongs(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const songs = await this.songService.getAllSongs();
      const favorites = this.favoriteIdsSignal();

      if (songs.length === 0) {
        this.usingFallbackSignal.set(true);
        this.songsSignal.set(
          FALLBACK_SONGS.map((song) => ({
            ...song,
            favorite: favorites.has(song.id),
          })),
        );
        return;
      }

      this.usingFallbackSignal.set(false);
      this.songsSignal.set(
        songs.map((song) => this.enrichSong(song, favorites)),
      );
    } catch (error) {
      this.errorSignal.set(
        error instanceof Error ? error.message : "Unable to load songs.",
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  getSongById(songId: string): Song | null {
    return this.songsSignal().find((song) => song.id === songId) ?? null;
  }

  toggleFavorite(songId: string): void {
    const next = new Set(this.favoriteIdsSignal());

    if (next.has(songId)) {
      next.delete(songId);
    } else {
      next.add(songId);
    }

    this.favoriteIdsSignal.set(next);
    this.persistFavoriteIds(next);
    this.songsSignal.update((songs) =>
      songs.map((song) =>
        song.id === songId ? { ...song, favorite: next.has(songId) } : song,
      ),
    );
  }

  private enrichSong(song: Song, favorites: Set<string>): Song {
    return {
      ...song,
      artworkColor: song.artworkColor ?? artworkColorForKey(song.id || song.title),
      favorite: favorites.has(song.id),
    };
  }

  private readFavoriteIds(): Set<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) {
        return new Set();
      }

      const parsed = JSON.parse(raw) as string[];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  private persistFavoriteIds(ids: Set<string>): void {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]));
  }
}
