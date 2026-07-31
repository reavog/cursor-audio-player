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
        min-height: 0;
      }
      .queue-page {
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class QueuePage {}
