import { Component } from "@angular/core";
import { Tracks } from "./tracks/tracks";

@Component({
  selector: "app-root",
  imports: [Tracks],
  templateUrl: "./app.html",
  styleUrls: ["./app.scss"],
})
export class App {
  title = "Audio Player";
}
