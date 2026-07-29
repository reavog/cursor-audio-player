import { Component, computed, inject, input, output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { Playlist } from "../../core/models/playlist.model";
import { IconButton } from "../../shared/components/icon-button/icon-button";

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

@Component({
  selector: "app-sidebar",
  imports: [RouterLink, RouterLinkActive, IconButton],
  templateUrl: "./sidebar.html",
  styleUrls: ["./sidebar.scss"],
})
export class Sidebar {
  readonly collapsed = input(false);
  readonly playlists = input<Playlist[]>([]);
  readonly closeRequested = output<void>();

  readonly navItems: NavItem[] = [
    { label: "Home", icon: "home", link: "/", exact: true },
    { label: "Playlists", icon: "library_music", link: "/playlists" },
    { label: "Queue", icon: "queue_music", link: "/queue" },
    { label: "Songs", icon: "music_note", link: "/", exact: true },
    { label: "Search", icon: "search", link: "/search" },
  ];

  readonly visiblePlaylists = computed(() => this.playlists().slice(0, 4));

  onNavClick(): void {
    this.closeRequested.emit();
  }
}
