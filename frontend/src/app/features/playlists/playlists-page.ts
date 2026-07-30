import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { PlaylistService } from "../../core/services/playlist.service";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { IconButton } from "../../shared/components/icon-button/icon-button";
import { PlaylistCard } from "../../shared/components/playlist-card/playlist-card";
import { promptAndCreatePlaylist } from "./create-playlist";

@Component({
  selector: "app-playlists-page",
  imports: [EmptyState, IconButton, PlaylistCard],
  templateUrl: "./playlists-page.html",
  styleUrls: ["./playlists-page.scss"],
})
export class PlaylistsPage {
  private readonly playlistService = inject(PlaylistService);
  private readonly router = inject(Router);

  readonly playlists = this.playlistService.playlists;
  readonly playlistCount = this.playlistService.playlistCount;

  addPlaylist(): void {
    const playlist = promptAndCreatePlaylist(this.playlistService);
    if (!playlist) {
      return;
    }

    void this.router.navigate(["/playlists", playlist.id]);
  }
}
