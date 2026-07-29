import { Component, input } from "@angular/core";

@Component({
  selector: "app-loading-state",
  templateUrl: "./loading-state.html",
  styleUrls: ["./loading-state.scss"],
})
export class LoadingState {
  readonly message = input("Loading…");
}
