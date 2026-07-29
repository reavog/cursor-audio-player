import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PlaylistService } from "../../core/services/playlist.service";
import { EmptyState } from "../../shared/components/empty-state/empty-state";

@Component({
  selector: "app-playlists-page",
  imports: [EmptyState, RouterLink],
  template: `
    <section class="playlists-page" aria-labelledby="playlists-title">
      <h1 id="playlists-title">Playlists</h1>

      @if (playlists().length === 0) {
        <app-empty-state
          icon="library_music"
          title="No playlists yet"
          message="Playlists appear once your song library has loaded."
        />
      } @else {
        <div class="playlist-grid">
          @for (playlist of playlists(); track playlist.id) {
            <a class="playlist-card" [routerLink]="['/playlists', playlist.id]">
              <span class="swatch" [style.background]="playlist.artworkColor" aria-hidden="true"></span>
              <span class="name">{{ playlist.name }}</span>
              <span class="count">{{ playlist.songCount }} songs</span>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .playlists-page {
        padding: var(--space-lg);
      }
      h1 {
        margin: 0 0 var(--space-lg);
        font-size: 1.5rem;
        font-weight: 600;
      }
      .playlist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: var(--space-md);
      }
      .playlist-card {
        display: grid;
        gap: 8px;
        padding: var(--space-md);
        color: inherit;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.45);
        border: 1px solid var(--subtle-border);
        border-radius: var(--radius-medium);
        transition: background-color 180ms ease, transform 180ms ease;
      }
      .playlist-card:hover {
        background: rgba(255, 255, 255, 0.72);
        transform: translateY(-1px);
      }
      .swatch {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 16px;
      }
      .name {
        font-weight: 600;
      }
      .count {
        color: var(--text-muted);
        font-size: 0.86rem;
      }
    `,
  ],
})
export class PlaylistsPage {
  private readonly playlistService = inject(PlaylistService);
  readonly playlists = this.playlistService.playlists;
}
