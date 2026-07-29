import { Component, input } from "@angular/core";

@Component({
  selector: "app-glass-panel",
  templateUrl: "./glass-panel.html",
  styleUrls: ["./glass-panel.scss"],
})
export class GlassPanel {
  readonly ariaLabel = input<string | null>(null);
  readonly strong = input(false);
}
