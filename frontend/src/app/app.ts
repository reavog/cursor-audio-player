import { Component, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.html",
  styleUrls: ["./app.scss"],
})
export class App {
  private readonly authService = inject(AuthService);

  title = "Audio Player";

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly username = computed(() => this.authService.user()?.username ?? null);

  logout(): void {
    this.authService.logout();
  }
}
