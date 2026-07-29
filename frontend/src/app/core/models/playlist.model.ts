export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  artworkColor: string;
  songCount: number;
}
