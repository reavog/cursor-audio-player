import { Injectable, inject } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Song } from "../models/song.model";

interface SongApiDto {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
}

@Injectable({
  providedIn: "root",
})
export class SongService {
  private readonly url = "/api/songs";
  private readonly authService = inject(AuthService);

  async getAllSongs(): Promise<Song[]> {
    const response = await fetch(this.url, {
      headers: {
        ...this.authService.authorizationHeader(),
      },
    });

    if (response.status === 401) {
      this.authService.logout();
      throw new Error("Your session expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error("Unable to load songs from the API.");
    }

    const payload = (await response.json()) as SongApiDto[];
    return payload.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
    }));
  }

  async createAuthenticatedStreamUrl(songId: string): Promise<string> {
    const response = await fetch(`${this.url}/${songId}/stream`, {
      headers: {
        ...this.authService.authorizationHeader(),
      },
    });

    if (response.status === 401) {
      this.authService.logout();
      throw new Error("Your session expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error("Unable to load the audio stream.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  isStreamableSongId(songId: string): boolean {
    return !songId.startsWith("mock-");
  }
}
