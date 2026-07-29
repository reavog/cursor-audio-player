import { Component } from "@angular/core";
import { EmptyState } from "../../shared/components/empty-state/empty-state";

@Component({
  selector: "app-search-page",
  imports: [EmptyState],
  template: `
    <section class="placeholder-page" aria-labelledby="search-title">
      <h1 id="search-title">Search</h1>
      <app-empty-state
        icon="search"
        title="Search is coming next"
        message="Use the top search bar. Grouped results arrive in a later phase."
      />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .placeholder-page {
        padding: var(--space-lg);
      }
      h1 {
        margin: 0 0 var(--space-md);
        font-size: 1.5rem;
        font-weight: 600;
      }
    `,
  ],
})
export class SearchPage {}
