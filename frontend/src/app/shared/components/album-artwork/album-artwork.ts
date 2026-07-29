import { Component, input } from "@angular/core";

@Component({
  selector: "app-album-artwork",
  templateUrl: "./album-artwork.html",
  styleUrls: ["./album-artwork.scss"],
})
export class AlbumArtwork {
  readonly title = input("Artwork");
  readonly artworkUrl = input<string | null | undefined>(null);
  readonly artworkColor = input<string | undefined>(undefined);
  readonly size = input<"sm" | "md" | "lg">("md");
}
