import { Component, computed, input, output } from "@angular/core";
import { Song } from "../../../core/models/song.model";
import { formatDuration } from "../../utils/format-duration";
import { AlbumArtwork } from "../album-artwork/album-artwork";
import { IconButton } from "../icon-button/icon-button";

@Component({
  selector: "app-song-row",
  imports: [AlbumArtwork, IconButton],
  templateUrl: "./song-row.html",
  styleUrls: ["./song-row.scss"],
})
export class SongRow {
  readonly song = input.required<Song>();
  readonly index = input(0);
  readonly active = input(false);
  readonly playing = input(false);
  readonly compact = input(false);

  readonly selected = output<Song>();
  readonly favoriteToggled = output<Song>();
  readonly playRequested = output<Song>();

  readonly durationLabel = computed(() => formatDuration(this.song().duration));

  onActivate(): void {
    this.selected.emit(this.song());
    this.playRequested.emit(this.song());
  }

  onFavorite(event: MouseEvent): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.song());
  }
}
