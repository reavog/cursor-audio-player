import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-forgot-password",
  imports: [FormsModule, RouterLink],
  templateUrl: "./forgot-password.html",
  styleUrls: ["../auth-shared.scss"],
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  identifier = "";
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    this.message.set(null);

    try {
      const response = await this.authService.forgotPassword({
        identifier: this.identifier.trim(),
      });
      this.message.set(
        `${response.message} For local development, check the Spring Boot console for the OTP.`,
      );
      await this.router.navigate(["/otp"], {
        queryParams: { identifier: this.identifier.trim() },
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to send a sign-in code.");
    } finally {
      this.submitting.set(false);
    }
  }
}
