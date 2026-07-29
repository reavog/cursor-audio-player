import { Playlist } from "../models/playlist.model";
import { artworkColorForKey } from "./mock-songs.fallback";

interface PlaylistSeed {
  id: string;
  name: string;
  description: string;
  colorKey: string;
}

const PLAYLIST_SEEDS: PlaylistSeed[] = [
  {
    id: "playlist-chill-vibes",
    name: "Chill Vibes",
    description: "Soft tracks for unwinding.",
    colorKey: "Chill Vibes",
  },
  {
    id: "playlist-workout",
    name: "Workout",
    description: "Steady energy for movement.",
    colorKey: "Workout",
  },
  {
    id: "playlist-focus-flow",
    name: "Focus Flow",
    description: "Calm momentum for deep work.",
    colorKey: "Focus Flow",
  },
  {
    id: "playlist-late-night",
    name: "Late Night",
    description: "Quiet listening after dark.",
    colorKey: "Late Night",
  },
];

export function buildMockPlaylists(songIds: string[]): Playlist[] {
  if (songIds.length === 0) {
    return PLAYLIST_SEEDS.map((seed) => ({
      id: seed.id,
      name: seed.name,
      description: seed.description,
      songIds: [],
      artworkColor: artworkColorForKey(seed.colorKey),
      songCount: 0,
    }));
  }

  return PLAYLIST_SEEDS.map((seed, index) => {
    const start = index % songIds.length;
    const count = Math.min(4, songIds.length);
    const selected: string[] = [];

    for (let offset = 0; offset < count; offset += 1) {
      selected.push(songIds[(start + offset) % songIds.length]);
    }

    return {
      id: seed.id,
      name: seed.name,
      description: seed.description,
      songIds: selected,
      artworkColor: artworkColorForKey(seed.colorKey),
      songCount: selected.length,
    };
  });
}
