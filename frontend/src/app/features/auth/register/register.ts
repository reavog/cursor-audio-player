import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-register",
  imports: [FormsModule, RouterLink],
  templateUrl: "./register.html",
  styleUrls: ["../auth-shared.scss"],
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = "";
  email = "";
  password = "";
  confirmPassword = "";
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.password !== this.confirmPassword) {
      this.error.set("Passwords do not match.");
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.authService.register({
        username: this.username.trim(),
        email: this.email.trim(),
        password: this.password,
      });
      await this.authService.login({
        identifier: this.username.trim(),
        password: this.password,
      });
      await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to create an account.");
    } finally {
      this.submitting.set(false);
    }
  }
}
