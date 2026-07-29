import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { MusicLibraryService } from "../../core/services/music-library.service";
import { PlaylistService } from "../../core/services/playlist.service";
import { PlayerUiService } from "../../core/services/player-ui.service";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { GlassPanel } from "../../shared/components/glass-panel/glass-panel";
import { Sidebar } from "../sidebar/sidebar";
import { TopSearchBar } from "../top-search-bar/top-search-bar";
import { QueuePanel } from "../../features/queue/queue-panel";
import { NowPlayingBar } from "../../features/player/now-playing-bar/now-playing-bar";

@Component({
  selector: "app-shell",
  imports: [RouterOutlet, GlassPanel, Sidebar, TopSearchBar, QueuePanel, NowPlayingBar],
  templateUrl: "./app-shell.html",
  styleUrls: ["./app-shell.scss"],
})
export class AppShell implements OnInit, OnDestroy {
  private readonly library = inject(MusicLibraryService);
  private readonly playlists = inject(PlaylistService);
  private readonly player = inject(AudioPlayerService);
  private readonly router = inject(Router);
  readonly playerUi = inject(PlayerUiService);

  readonly playlistItems = this.playlists.playlists;
  readonly sidebarCollapsed = this.playerUi.sidebarCollapsed;
  readonly sidebarDrawerOpen = this.playerUi.sidebarDrawerOpen;
  readonly queueDrawerOpen = this.playerUi.queueDrawerOpen;

  private mediaQuery?: MediaQueryList;
  private readonly onViewportChange = (event: MediaQueryListEvent | MediaQueryList): void => {
    this.playerUi.setSidebarCollapsed(event.matches);
    if (!event.matches) {
      this.playerUi.closeSidebarDrawer();
      this.playerUi.closeQueueDrawer();
    }
  };

  async ngOnInit(): Promise<void> {
    this.mediaQuery = window.matchMedia("(max-width: 1199px)");
    this.onViewportChange(this.mediaQuery);
    this.mediaQuery.addEventListener("change", this.onViewportChange);

    await this.library.loadSongs();
    this.player.rememberSongs(this.library.songs());
    this.playlists.syncFromLibrary();
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener("change", this.onViewportChange);
    this.player.destroy();
  }

  openSidebar(): void {
    this.playerUi.openSidebarDrawer();
  }

  closeSidebar(): void {
    this.playerUi.closeSidebarDrawer();
  }

  closeQueue(): void {
    this.playerUi.closeQueueDrawer();
  }

  onSearch(query: string): void {
    if (!query) {
      void this.router.navigate(["/"]);
      return;
    }

    void this.router.navigate(["/search"], { queryParams: { q: query } });
  }
}
