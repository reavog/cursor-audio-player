import { Playlist } from "../../core/models/playlist.model";
import { PlaylistService } from "../../core/services/playlist.service";

export function promptAndCreatePlaylist(playlistService: PlaylistService): Playlist | null {
  const name = window.prompt("Playlist name");
  if (name === null) {
    return null;
  }

  return playlistService.createPlaylist(name);
}
