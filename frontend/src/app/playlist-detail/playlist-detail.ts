import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Playlist, PlaylistService } from "../playlistservice";
import { Song, SongService } from "../songservice";

@Component({
  selector: "app-playlist-detail",
  imports: [FormsModule, RouterLink],
  templateUrl: "./playlist-detail.html",
  styleUrls: ["./playlist-detail.scss"],
})
export class PlaylistDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly playlistService = inject(PlaylistService);
  private readonly songService = inject(SongService);

  readonly playlist = signal<Playlist | null>(null);
  readonly librarySongs = signal<Song[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly renaming = signal(false);
  readonly renameValue = signal("");
  readonly savingRename = signal(false);
  readonly addingSongId = signal<string | null>(null);
  readonly removingSongId = signal<string | null>(null);

  readonly playlistSongIds = computed(() => {
    const songs = this.playlist()?.songs ?? [];
    return new Set(songs.map((song) => song.id));
  });

  readonly availableSongs = computed(() => {
    const existing = this.playlistSongIds();
    return this.librarySongs().filter((song) => !existing.has(song.id));
  });

  async ngOnInit(): Promise<void> {
    await this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Playlist not found.");
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [playlist, songs] = await Promise.all([
        this.playlistService.get(id),
        this.songService.getAllSongs(),
      ]);
      this.playlist.set(playlist);
      this.librarySongs.set(songs);
      this.renameValue.set(playlist.name);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to load playlist.");
    } finally {
      this.loading.set(false);
    }
  }

  startRename(): void {
    const current = this.playlist();
    if (!current) {
      return;
    }
    this.renameValue.set(current.name);
    this.renaming.set(true);
  }

  cancelRename(): void {
    this.renaming.set(false);
    this.renameValue.set(this.playlist()?.name ?? "");
  }

  async saveRename(): Promise<void> {
    const current = this.playlist();
    const name = this.renameValue().trim();
    if (!current || !name || this.savingRename()) {
      return;
    }

    this.savingRename.set(true);
    this.error.set(null);

    try {
      const updated = await this.playlistService.rename(current.id, name);
      this.playlist.set(updated);
      this.renaming.set(false);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to rename playlist.");
    } finally {
      this.savingRename.set(false);
    }
  }

  async addSong(song: Song): Promise<void> {
    const current = this.playlist();
    if (!current || this.addingSongId()) {
      return;
    }

    this.addingSongId.set(song.id);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const updated = await this.playlistService.addSong(current.id, song.id);
      this.playlist.set(updated);
      this.successMessage.set(`Added “${song.title || "Untitled song"}” to this playlist.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to add song.");
    } finally {
      this.addingSongId.set(null);
    }
  }

  async removeSong(song: Song): Promise<void> {
    const current = this.playlist();
    if (!current || this.removingSongId()) {
      return;
    }

    this.removingSongId.set(song.id);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const updated = await this.playlistService.removeSong(current.id, song.id);
      this.playlist.set(updated);
      this.successMessage.set(`Removed “${song.title || "Untitled song"}” from this playlist.`);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Unable to remove this song from the playlist.",
      );
    } finally {
      this.removingSongId.set(null);
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
