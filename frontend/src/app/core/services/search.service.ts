import { Injectable, inject } from "@angular/core";
import {
  AlbumResult,
  ArtistResult,
  SearchResults,
  SearchTopResult,
} from "../models/search.model";
import { Song } from "../models/song.model";
import { MusicLibraryService } from "./music-library.service";
import { PlaylistService } from "./playlist.service";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  private readonly library = inject(MusicLibraryService);
  private readonly playlists = inject(PlaylistService);

  search(rawQuery: string): SearchResults {
    const query = rawQuery.trim();

    if (!query) {
      return emptyResults(query);
    }

    const needle = query.toLowerCase();
    const songs = this.library
      .songs()
      .filter((song) => matchesSong(song, needle))
      .slice()
      .sort((left, right) => compareSongRelevance(left, right, needle));

    const artists = groupArtists(songs);
    const albums = groupAlbums(songs);
    const matchedPlaylists = this.playlists
      .playlists()
      .filter((playlist) => {
        const name = playlist.name.toLowerCase();
        const description = (playlist.description ?? "").toLowerCase();
        return name.includes(needle) || description.includes(needle);
      });

    return {
      query,
      top: pickTopResult(songs, artists, albums, matchedPlaylists, needle),
      songs,
      artists,
      albums,
      playlists: matchedPlaylists,
    };
  }
}

function emptyResults(query: string): SearchResults {
  return {
    query,
    top: null,
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  };
}

function matchesSong(song: Song, needle: string): boolean {
  return (
    song.title.toLowerCase().includes(needle) ||
    song.artist.toLowerCase().includes(needle) ||
    song.album.toLowerCase().includes(needle)
  );
}

function songRelevanceScore(song: Song, needle: string): number {
  const title = song.title.toLowerCase();
  const artist = song.artist.toLowerCase();
  const album = song.album.toLowerCase();

  if (title === needle) {
    return 0;
  }
  if (title.startsWith(needle)) {
    return 1;
  }
  if (artist === needle || album === needle) {
    return 2;
  }
  if (artist.startsWith(needle) || album.startsWith(needle)) {
    return 3;
  }
  if (title.includes(needle)) {
    return 4;
  }
  return 5;
}

function compareSongRelevance(left: Song, right: Song, needle: string): number {
  const scoreDiff = songRelevanceScore(left, needle) - songRelevanceScore(right, needle);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }
  return left.title.localeCompare(right.title);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function groupArtists(songs: Song[]): ArtistResult[] {
  const map = new Map<string, ArtistResult>();

  for (const song of songs) {
    const key = song.artist.trim().toLowerCase();
    const existing = map.get(key);

    if (existing) {
      existing.songCount += 1;
      continue;
    }

    map.set(key, {
      id: `artist-${slugify(song.artist)}`,
      name: song.artist,
      songCount: 1,
      artworkColor: song.artworkColor ?? "linear-gradient(135deg, #ddd6fe, #bfdbfe)",
    });
  }

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function groupAlbums(songs: Song[]): AlbumResult[] {
  const map = new Map<string, AlbumResult>();

  for (const song of songs) {
    const key = `${song.album.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`;
    const existing = map.get(key);

    if (existing) {
      existing.songCount += 1;
      continue;
    }

    map.set(key, {
      id: `album-${slugify(`${song.album}-${song.artist}`)}`,
      name: song.album,
      artist: song.artist,
      songCount: 1,
      artworkColor: song.artworkColor ?? "linear-gradient(135deg, #ddd6fe, #bfdbfe)",
    });
  }

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function pickTopResult(
  songs: Song[],
  artists: ArtistResult[],
  albums: AlbumResult[],
  playlists: SearchResults["playlists"],
  needle: string,
): SearchTopResult | null {
  if (songs.length > 0) {
    const bestSong = songs[0];
    const title = bestSong.title.toLowerCase();
    if (
      title === needle ||
      title.startsWith(needle) ||
      title.includes(needle) ||
      artists.length === 0
    ) {
      return { type: "song", song: bestSong };
    }
  }

  const exactArtist = artists.find((artist) => artist.name.toLowerCase() === needle);
  if (exactArtist) {
    return { type: "artist", artist: exactArtist };
  }

  const exactAlbum = albums.find((album) => album.name.toLowerCase() === needle);
  if (exactAlbum) {
    return { type: "album", album: exactAlbum };
  }

  const exactPlaylist = playlists.find(
    (playlist) => playlist.name.toLowerCase() === needle,
  );
  if (exactPlaylist) {
    return { type: "playlist", playlist: exactPlaylist };
  }

  if (songs.length > 0) {
    return { type: "song", song: songs[0] };
  }
  if (artists.length > 0) {
    return { type: "artist", artist: artists[0] };
  }
  if (albums.length > 0) {
    return { type: "album", album: albums[0] };
  }
  if (playlists.length > 0) {
    return { type: "playlist", playlist: playlists[0] };
  }

  return null;
}
