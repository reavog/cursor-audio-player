import { Component, input } from "@angular/core";

@Component({
  selector: "app-empty-state",
  templateUrl: "./empty-state.html",
  styleUrls: ["./empty-state.scss"],
})
export class EmptyState {
  readonly icon = input("library_music");
  readonly title = input("Nothing here yet");
  readonly message = input("Try another action or check back later.");
  readonly tone = input<"default" | "error">("default");
}
