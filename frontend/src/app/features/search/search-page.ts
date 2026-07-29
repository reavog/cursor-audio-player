import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { map } from "rxjs";
import { AlbumResult, ArtistResult, SearchTopResult } from "../../core/models/search.model";
import { Song } from "../../core/models/song.model";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { MusicLibraryService } from "../../core/services/music-library.service";
import { PlaylistService } from "../../core/services/playlist.service";
import { SearchService } from "../../core/services/search.service";
import { AlbumArtwork } from "../../shared/components/album-artwork/album-artwork";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { LoadingState } from "../../shared/components/loading-state/loading-state";
import { SongRow } from "../../shared/components/song-row/song-row";

@Component({
  selector: "app-search-page",
  imports: [AlbumArtwork, EmptyState, LoadingState, RouterLink, SongRow],
  templateUrl: "./search-page.html",
  styleUrls: ["./search-page.scss"],
})
export class SearchPage {
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly library = inject(MusicLibraryService);
  private readonly playlists = inject(PlaylistService);
  private readonly player = inject(AudioPlayerService);

  private readonly queryParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("q") ?? "")),
    { initialValue: "" },
  );

  readonly query = computed(() => this.queryParam().trim());
  readonly results = computed(() => this.searchService.search(this.query()));
  readonly loading = this.library.loading;
  readonly error = this.library.error;
  readonly currentSong = this.player.currentSong;
  readonly isPlaying = this.player.isPlaying;

  readonly hasResults = computed(() => {
    const results = this.results();
    return (
      results.songs.length > 0 ||
      results.artists.length > 0 ||
      results.albums.length > 0 ||
      results.playlists.length > 0
    );
  });

  async playSong(song: Song): Promise<void> {
    const songs = this.results().songs;
    const startIndex = songs.findIndex((item) => item.id === song.id);
    await this.player.playSong(song, {
      queue: songs.length > 0 ? songs : [song],
      startIndex: startIndex >= 0 ? startIndex : 0,
    });
  }

  async playTopResult(): Promise<void> {
    const top = this.results().top;
    if (!top) {
      return;
    }

    if (top.type === "song") {
      await this.playSong(top.song);
      return;
    }

    if (top.type === "artist") {
      const songs = this.songsForArtist(top.artist);
      if (songs.length > 0) {
        await this.player.playSong(songs[0], { queue: songs, startIndex: 0 });
      }
      return;
    }

    if (top.type === "album") {
      const songs = this.songsForAlbum(top.album);
      if (songs.length > 0) {
        await this.player.playSong(songs[0], { queue: songs, startIndex: 0 });
      }
      return;
    }

    const songs = this.playlists.getPlaylistSongs(top.playlist.id);
    if (songs.length > 0) {
      await this.player.playSong(songs[0], { queue: songs, startIndex: 0 });
    }
  }

  toggleFavorite(song: Song): void {
    this.library.toggleFavorite(song.id);
  }

  topTitle(top: SearchTopResult): string {
    switch (top.type) {
      case "song":
        return top.song.title;
      case "artist":
        return top.artist.name;
      case "album":
        return top.album.name;
      case "playlist":
        return top.playlist.name;
    }
  }

  topTypeLabel(top: SearchTopResult): string {
    switch (top.type) {
      case "song":
        return "Song";
      case "artist":
        return "Artist";
      case "album":
        return "Album";
      case "playlist":
        return "Playlist";
    }
  }

  topMeta(top: SearchTopResult): string {
    switch (top.type) {
      case "song":
        return `${top.song.artist} · ${top.song.album}`;
      case "artist":
        return `${top.artist.songCount} songs`;
      case "album":
        return `${top.album.artist} · ${top.album.songCount} songs`;
      case "playlist":
        return `${top.playlist.songCount} songs`;
    }
  }

  topArtworkColor(top: SearchTopResult): string | undefined {
    switch (top.type) {
      case "song":
        return top.song.artworkColor;
      case "artist":
        return top.artist.artworkColor;
      case "album":
        return top.album.artworkColor;
      case "playlist":
        return top.playlist.artworkColor;
    }
  }

  topArtworkUrl(top: SearchTopResult): string | null | undefined {
    return top.type === "song" ? top.song.artworkUrl : undefined;
  }

  private songsForArtist(artist: ArtistResult): Song[] {
    return this.library.songs().filter((song) => song.artist === artist.name);
  }

  private songsForAlbum(album: AlbumResult): Song[] {
    return this.library
      .songs()
      .filter((song) => song.album === album.name && song.artist === album.artist);
  }
}
