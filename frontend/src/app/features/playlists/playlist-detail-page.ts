import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { PlaylistService } from "../../core/services/playlist.service";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { SongRow } from "../../shared/components/song-row/song-row";
import { Song } from "../../core/models/song.model";

@Component({
  selector: "app-playlist-detail-page",
  imports: [EmptyState, RouterLink, SongRow],
  template: `
    <section class="playlist-detail" aria-labelledby="playlist-detail-title">
      <a class="back-link" routerLink="/playlists">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        All playlists
      </a>

      @if (!playlist()) {
        <app-empty-state
          icon="error"
          title="Playlist not found"
          message="This playlist is unavailable."
        />
      } @else {
        <header class="header">
          <div class="swatch" [style.background]="playlist()!.artworkColor" aria-hidden="true"></div>
          <div>
            <p class="eyebrow">Playlist</p>
            <h1 id="playlist-detail-title">{{ playlist()!.name }}</h1>
            <p class="meta">{{ songs().length }} songs</p>
            <button class="play-all" type="button" [disabled]="songs().length === 0" (click)="playAll()">
              <span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>
              Play all
            </button>
          </div>
        </header>

        @if (songs().length === 0) {
          <app-empty-state
            icon="library_music"
            title="Empty playlist"
            message="This playlist has no songs yet."
          />
        } @else {
          <div class="song-list">
            @for (song of songs(); track song.id; let index = $index) {
              <app-song-row
                [song]="song"
                [index]="index"
                [active]="currentSong()?.id === song.id"
                [playing]="currentSong()?.id === song.id && isPlaying()"
                (playRequested)="playSong($event)"
              />
            }
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .playlist-detail {
        padding: var(--space-lg);
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: var(--space-md);
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .header {
        display: flex;
        gap: var(--space-lg);
        margin-bottom: var(--space-lg);
      }
      .swatch {
        width: 140px;
        aspect-ratio: 1;
        border-radius: 22px;
        box-shadow: var(--shadow-medium);
      }
      .eyebrow {
        margin: 0 0 4px;
        color: var(--accent);
        font-size: 0.76rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: 1.7rem;
        font-weight: 600;
      }
      .meta {
        margin: 8px 0 var(--space-md);
        color: var(--text-muted);
      }
      .play-all {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        padding: 0 16px;
        color: white;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.92), rgba(167, 139, 250, 0.9));
        border: 0;
        border-radius: 999px;
        cursor: pointer;
      }
      .play-all:disabled {
        opacity: 0.48;
        cursor: not-allowed;
      }
      .song-list {
        display: grid;
        gap: 2px;
      }
      @media (max-width: 720px) {
        .header {
          flex-direction: column;
        }
        .swatch {
          width: 112px;
        }
      }
    `,
  ],
})
export class PlaylistDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly playlistService = inject(PlaylistService);
  private readonly player = inject(AudioPlayerService);

  private readonly playlistId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("id") ?? "")),
    { initialValue: "" },
  );

  readonly playlist = computed(() => this.playlistService.getPlaylistById(this.playlistId()));
  readonly songs = computed(() => this.playlistService.getPlaylistSongs(this.playlistId()));
  readonly currentSong = this.player.currentSong;
  readonly isPlaying = this.player.isPlaying;

  async playAll(): Promise<void> {
    const songs = this.songs();
    if (songs.length === 0) {
      return;
    }
    await this.player.playSong(songs[0], { queue: songs, startIndex: 0 });
  }

  async playSong(song: Song): Promise<void> {
    const songs = this.songs();
    const startIndex = songs.findIndex((item) => item.id === song.id);
    await this.player.playSong(song, {
      queue: songs,
      startIndex: startIndex >= 0 ? startIndex : 0,
    });
  }
}
