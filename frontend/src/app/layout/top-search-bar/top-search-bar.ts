import { Component, computed, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/auth/auth.service";
import { IconButton } from "../../shared/components/icon-button/icon-button";

@Component({
  selector: "app-top-search-bar",
  imports: [FormsModule, IconButton],
  templateUrl: "./top-search-bar.html",
  styleUrls: ["./top-search-bar.scss"],
})
export class TopSearchBar {
  private readonly authService = inject(AuthService);

  readonly menuOpenRequested = output<void>();
  readonly searchSubmitted = output<string>();

  readonly query = signal("");
  readonly username = computed(() => this.authService.user()?.username ?? "Account");
  readonly accountMenuOpen = signal(false);

  onInput(value: string): void {
    this.query.set(value);
  }

  clearQuery(): void {
    this.query.set("");
    this.searchSubmitted.emit("");
  }

  submitSearch(): void {
    this.searchSubmitted.emit(this.query().trim());
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.accountMenuOpen.set(false);
    this.authService.logout();
  }
}
