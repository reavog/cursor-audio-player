import { Song } from "../models/song.model";

/** Soft palette used when API songs lack artwork. */
export const ARTWORK_COLORS = [
  "linear-gradient(135deg, #ddd6fe, #bfdbfe)",
  "linear-gradient(135deg, #fbcfe8, #ddd6fe)",
  "linear-gradient(135deg, #c7d2fe, #e9d5ff)",
  "linear-gradient(135deg, #bfdbfe, #fce7f3)",
  "linear-gradient(135deg, #e9d5ff, #cffafe)",
  "linear-gradient(135deg, #fde68a, #ddd6fe)",
];

export function artworkColorForKey(key: string): string {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash + key.charCodeAt(index) * (index + 1)) % ARTWORK_COLORS.length;
  }

  return ARTWORK_COLORS[hash];
}

/**
 * Fallback catalog used only when the API returns an empty library.
 * These IDs are not streamable against the backend.
 */
export const FALLBACK_SONGS: Song[] = [
  {
    id: "mock-midnight-dreams",
    title: "Midnight Dreams",
    artist: "Luna Vale",
    album: "Night Bloom",
    duration: 214,
    artworkColor: artworkColorForKey("Midnight Dreams"),
  },
  {
    id: "mock-electric-heart",
    title: "Electric Heart",
    artist: "Neon Harbor",
    album: "City Lights",
    duration: 198,
    artworkColor: artworkColorForKey("Electric Heart"),
  },
  {
    id: "mock-endless-skies",
    title: "Endless Skies",
    artist: "Aria Sol",
    album: "Horizon",
    duration: 241,
    artworkColor: artworkColorForKey("Endless Skies"),
  },
  {
    id: "mock-golden-hour",
    title: "Golden Hour",
    artist: "Soft Parade",
    album: "Afternoon",
    duration: 226,
    artworkColor: artworkColorForKey("Golden Hour"),
  },
  {
    id: "mock-fading-echoes",
    title: "Fading Echoes",
    artist: "Velvet Room",
    album: "Afterglow",
    duration: 205,
    artworkColor: artworkColorForKey("Fading Echoes"),
  },
  {
    id: "mock-better-days",
    title: "Better Days",
    artist: "Northline",
    album: "Open Road",
    duration: 232,
    artworkColor: artworkColorForKey("Better Days"),
  },
  {
    id: "mock-ocean-drive",
    title: "Ocean Drive",
    artist: "Coastal Kids",
    album: "Salt Air",
    duration: 189,
    artworkColor: artworkColorForKey("Ocean Drive"),
  },
  {
    id: "mock-paper-planes",
    title: "Paper Planes",
    artist: "Folded Notes",
    album: "Sketchbook",
    duration: 211,
    artworkColor: artworkColorForKey("Paper Planes"),
  },
];
