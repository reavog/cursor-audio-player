import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
} from "@angular/core";
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
import { NowPlayingSheet } from "../../features/player/now-playing-sheet/now-playing-sheet";
import { trapFocus } from "../../shared/utils/trap-focus";

@Component({
  selector: "app-shell",
  imports: [
    RouterOutlet,
    GlassPanel,
    Sidebar,
    TopSearchBar,
    QueuePanel,
    NowPlayingBar,
    NowPlayingSheet,
  ],
  templateUrl: "./app-shell.html",
  styleUrls: ["./app-shell.scss"],
})
export class AppShell implements OnInit, OnDestroy {
  @ViewChild("queueCloseButton") private queueCloseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild("queueSlot") private queueSlot?: ElementRef<HTMLElement>;
  @ViewChild("sidebarSlot") private sidebarSlot?: ElementRef<HTMLElement>;

  private readonly library = inject(MusicLibraryService);
  private readonly playlists = inject(PlaylistService);
  private readonly player = inject(AudioPlayerService);
  private readonly router = inject(Router);
  readonly playerUi = inject(PlayerUiService);

  readonly playlistItems = this.playlists.playlists;
  readonly sidebarCollapsed = this.playerUi.sidebarCollapsed;
  readonly sidebarDrawerOpen = this.playerUi.sidebarDrawerOpen;
  readonly queueDrawerOpen = this.playerUi.queueDrawerOpen;
  readonly nowPlayingSheetOpen = this.playerUi.nowPlayingSheetOpen;
  readonly isNarrowViewport = signal(false);

  private mediaQuery?: MediaQueryList;
  private previousQueueFocus: HTMLElement | null = null;
  private previousSidebarFocus: HTMLElement | null = null;
  private wasQueueDrawerOpen = false;
  private wasSidebarDrawerOpen = false;
  private releaseQueueTrap: (() => void) | null = null;
  private releaseSidebarTrap: (() => void) | null = null;

  private readonly onViewportChange = (event: MediaQueryListEvent | MediaQueryList): void => {
    this.playerUi.setSidebarCollapsed(event.matches);
    this.isNarrowViewport.set(event.matches);
    if (!event.matches) {
      this.playerUi.closeSidebarDrawer();
      this.playerUi.closeQueueDrawer();
    }
  };

  constructor() {
    effect(() => {
      const open = this.queueDrawerOpen();
      const isNarrow = this.isNarrowViewport();

      if (open && !this.wasQueueDrawerOpen && isNarrow) {
        this.previousQueueFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.body.classList.add("melody-overlay-open");
        queueMicrotask(() => {
          this.queueCloseButton?.nativeElement.focus();
          this.attachQueueTrap();
        });
      }

      if (!open && this.wasQueueDrawerOpen) {
        this.releaseQueueTrap?.();
        this.releaseQueueTrap = null;
        if (!this.sidebarDrawerOpen() && !this.nowPlayingSheetOpen()) {
          document.body.classList.remove("melody-overlay-open");
        }
        const restoreTarget =
          this.previousQueueFocus ??
          (document.getElementById("queue-drawer-toggle") as HTMLElement | null);
        queueMicrotask(() => restoreTarget?.focus());
        this.previousQueueFocus = null;
      }

      this.wasQueueDrawerOpen = open;
    });

    effect(() => {
      const open = this.sidebarDrawerOpen();

      if (open && !this.wasSidebarDrawerOpen) {
        this.previousSidebarFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.body.classList.add("melody-overlay-open");
        queueMicrotask(() => {
          const firstLink = this.sidebarSlot?.nativeElement.querySelector<HTMLElement>("a.nav-item");
          firstLink?.focus();
          this.attachSidebarTrap();
        });
      }

      if (!open && this.wasSidebarDrawerOpen) {
        this.releaseSidebarTrap?.();
        this.releaseSidebarTrap = null;
        if (!this.queueDrawerOpen() && !this.nowPlayingSheetOpen()) {
          document.body.classList.remove("melody-overlay-open");
        }
        queueMicrotask(() => this.previousSidebarFocus?.focus());
        this.previousSidebarFocus = null;
      }

      this.wasSidebarDrawerOpen = open;
    });
  }

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
    this.releaseQueueTrap?.();
    this.releaseSidebarTrap?.();
    document.body.classList.remove("melody-overlay-open");
    this.player.destroy();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.nowPlayingSheetOpen()) {
      this.playerUi.closeNowPlayingSheet();
      return;
    }

    if (this.queueDrawerOpen()) {
      this.closeQueue();
      return;
    }

    if (this.sidebarDrawerOpen()) {
      this.closeSidebar();
    }
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

  private attachQueueTrap(): void {
    this.releaseQueueTrap?.();
    const root = this.queueSlot?.nativeElement;
    if (root) {
      this.releaseQueueTrap = trapFocus(root);
    }
  }

  private attachSidebarTrap(): void {
    this.releaseSidebarTrap?.();
    const root = this.sidebarSlot?.nativeElement;
    if (root) {
      this.releaseSidebarTrap = trapFocus(root);
    }
  }
}
