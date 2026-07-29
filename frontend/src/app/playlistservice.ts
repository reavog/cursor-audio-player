import { Injectable, inject } from "@angular/core";
import { AuthService } from "./core/auth/auth.service";
import { Song } from "./songservice";

export interface Playlist {
  id: string;
  name: string;
  creatorUsername: string;
  createdAt: string;
  songCount: number;
  totalDurationSeconds: number;
  songs: Song[];
}

@Injectable({
  providedIn: "root",
})
export class PlaylistService {
  private readonly url = "/api/playlists";
  private readonly authService = inject(AuthService);

  async list(): Promise<Playlist[]> {
    return this.requestJson<Playlist[]>(this.url);
  }

  async get(id: string): Promise<Playlist> {
    return this.requestJson<Playlist>(`${this.url}/${id}`);
  }

  async create(name: string): Promise<Playlist> {
    return this.requestJson<Playlist>(this.url, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async rename(id: string, name: string): Promise<Playlist> {
    return this.requestJson<Playlist>(`${this.url}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  }

  async addSong(playlistId: string, songId: string): Promise<Playlist> {
    return this.requestJson<Playlist>(`${this.url}/${playlistId}/songs`, {
      method: "POST",
      body: JSON.stringify({ songId }),
    });
  }

  private async requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...this.authService.authorizationHeader(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    };

    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 401) {
      this.authService.logout();
      throw new Error("Your session expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error(await this.readError(response, "Playlist request failed."));
    }

    return (await response.json()) as T;
  }

  private async readError(response: Response, fallback: string): Promise<string> {
    try {
      const payload = (await response.json()) as { message?: string; detail?: string };
      return payload.message || payload.detail || fallback;
    } catch {
      return fallback;
    }
  }
}
