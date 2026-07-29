import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Playlist, PlaylistService } from "../playlistservice";

@Component({
  selector: "app-playlists",
  imports: [FormsModule, RouterLink],
  templateUrl: "./playlists.html",
  styleUrls: ["./playlists.scss"],
})
export class Playlists implements OnInit {
  private readonly playlistService = inject(PlaylistService);

  readonly playlists = signal<Playlist[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly creating = signal(false);
  readonly newPlaylistName = signal("");
  readonly renamingId = signal<string | null>(null);
  readonly renameValue = signal("");
  readonly savingRename = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadPlaylists();
  }

  async loadPlaylists(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.playlists.set(await this.playlistService.list());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to load playlists.");
    } finally {
      this.loading.set(false);
    }
  }

  async createPlaylist(): Promise<void> {
    const name = this.newPlaylistName().trim();
    if (!name || this.creating()) {
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    try {
      const created = await this.playlistService.create(name);
      this.playlists.update((items) => [created, ...items]);
      this.newPlaylistName.set("");
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to create playlist.");
    } finally {
      this.creating.set(false);
    }
  }

  startRename(playlist: Playlist, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.renamingId.set(playlist.id);
    this.renameValue.set(playlist.name);
  }

  cancelRename(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.renamingId.set(null);
    this.renameValue.set("");
  }

  async saveRename(playlistId: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const name = this.renameValue().trim();
    if (!name || this.savingRename()) {
      return;
    }

    this.savingRename.set(true);
    this.error.set(null);

    try {
      const updated = await this.playlistService.rename(playlistId, name);
      this.playlists.update((items) =>
        items.map((item) => (item.id === playlistId ? { ...item, ...updated, songs: item.songs } : item)),
      );
      this.cancelRename();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to rename playlist.");
    } finally {
      this.savingRename.set(false);
    }
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0:00";
    }

    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  formatCreatedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }
}
