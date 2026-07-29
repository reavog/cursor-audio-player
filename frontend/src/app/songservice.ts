import { Injectable, inject } from "@angular/core";
import { AuthService } from "./core/auth/auth.service";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
}

export interface SongPage {
  content: Song[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: "root",
})
export class SongService {
  private readonly url = "/api/songs";
  private readonly authService = inject(AuthService);

  async getSongs(query = "", page = 0, size = 25, signal?: AbortSignal): Promise<SongPage> {
    const parameters = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    });
    const response = await fetch(`${this.url}?${parameters.toString()}`, {
      headers: {
        ...this.authService.authorizationHeader(),
      },
      signal,
    });

    if (response.status === 401) {
      this.authService.logout();
      throw new Error("Your session expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error(query ? "Unable to search the song library." : "Unable to load songs from the API.");
    }

    return (await response.json()) as SongPage;
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
}
