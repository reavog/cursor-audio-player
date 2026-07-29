import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Playlist } from "../../../core/models/playlist.model";

@Component({
  selector: "app-playlist-card",
  imports: [RouterLink],
  templateUrl: "./playlist-card.html",
  styleUrls: ["./playlist-card.scss"],
})
export class PlaylistCard {
  readonly playlist = input.required<Playlist>();
}
