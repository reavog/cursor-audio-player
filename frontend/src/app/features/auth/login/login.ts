import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-login",
  imports: [FormsModule, RouterLink],
  templateUrl: "./login.html",
  styleUrls: ["../auth-shared.scss"],
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  identifier = "";
  password = "";
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.authService.login({
        identifier: this.identifier.trim(),
        password: this.password,
      });
      await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      this.submitting.set(false);
    }
  }
}
