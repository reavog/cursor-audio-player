import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-otp-verify",
  imports: [FormsModule, RouterLink],
  templateUrl: "./otp-verify.html",
  styleUrls: ["../auth-shared.scss"],
})
export class OtpVerify implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  identifier = "";
  otp = "";
  newPassword = "";
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const identifier = this.route.snapshot.queryParamMap.get("identifier");
    if (identifier) {
      this.identifier = identifier;
    }
  }

  async onSubmit(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.authService.verifyOtp({
        identifier: this.identifier.trim(),
        otp: this.otp.trim().toUpperCase(),
        newPassword: this.newPassword.trim() || undefined,
      });
      await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Unable to verify the code.");
    } finally {
      this.submitting.set(false);
    }
  }
}
