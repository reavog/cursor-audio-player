import { Playlist } from "./playlist.model";
import { Song } from "./song.model";

export interface ArtistResult {
  id: string;
  name: string;
  songCount: number;
  artworkColor: string;
}

export interface AlbumResult {
  id: string;
  name: string;
  artist: string;
  songCount: number;
  artworkColor: string;
}

export type SearchTopResult =
  | { type: "song"; song: Song }
  | { type: "artist"; artist: ArtistResult }
  | { type: "album"; album: AlbumResult }
  | { type: "playlist"; playlist: Playlist };

export interface SearchResults {
  query: string;
  top: SearchTopResult | null;
  songs: Song[];
  artists: ArtistResult[];
  albums: AlbumResult[];
  playlists: Playlist[];
}
