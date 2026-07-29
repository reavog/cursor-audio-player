import { Component } from "@angular/core";
import { QueuePanel } from "./queue-panel";

@Component({
  selector: "app-queue-page",
  imports: [QueuePanel],
  template: `
    <section class="queue-page" aria-label="Queue page">
      <app-queue-panel />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .queue-page {
        height: 100%;
        overflow: auto;
      }
    `,
  ],
})
export class QueuePage {}
