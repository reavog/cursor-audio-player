export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artworkUrl?: string | null;
  artworkColor?: string;
  favorite?: boolean;
}
