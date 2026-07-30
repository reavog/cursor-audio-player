import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-icon-button",
  templateUrl: "./icon-button.html",
  styleUrls: ["./icon-button.scss"],
})
export class IconButton {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly variant = input<"default" | "accent" | "ghost">("default");
  readonly buttonId = input<string | undefined>(undefined);
  readonly ariaExpanded = input<boolean | undefined>(undefined);
  readonly ariaControls = input<string | undefined>(undefined);
  readonly pressed = output<MouseEvent>();
}
