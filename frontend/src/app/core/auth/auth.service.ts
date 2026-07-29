import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  OtpVerifyRequest,
  RegisterRequest,
} from "./auth.models";

const TOKEN_KEY = "audioplayer.accessToken";
const EXPIRES_AT_KEY = "audioplayer.expiresAt";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  constructor() {
    if (this.tokenSignal()) {
      void this.loadMe().catch(() => this.clearSession());
    }
  }

  async login(request: LoginRequest): Promise<void> {
    const response = await this.postJson<LoginResponse>("/api/auth/login", request);
    this.persistSession(response);
    await this.loadMe();
  }

  async register(request: RegisterRequest): Promise<MessageResponse> {
    return this.postJson<MessageResponse>("/api/auth/register", request);
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse> {
    return this.postJson<MessageResponse>("/api/auth/forgot-password", request);
  }

  async verifyOtp(request: OtpVerifyRequest): Promise<void> {
    const response = await this.postJson<LoginResponse>("/api/auth/otp/verify", request);
    this.persistSession(response);
    await this.loadMe();
  }

  async loadMe(): Promise<AuthUser> {
    const token = this.requireToken();
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await this.readError(response, "Unable to load the current user."));
    }

    const user = (await response.json()) as AuthUser;
    this.userSignal.set(user);
    return user;
  }

  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl("/login");
  }

  authorizationHeader(): Record<string, string> {
    const token = this.tokenSignal();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private persistSession(response: LoginResponse): void {
    const expiresAt = Date.now() + response.expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    this.tokenSignal.set(response.accessToken);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private readStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAtRaw = localStorage.getItem(EXPIRES_AT_KEY);
    if (!token || !expiresAtRaw) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
      return null;
    }

    return token;
  }

  private requireToken(): string {
    const token = this.tokenSignal();
    if (!token) {
      throw new Error("You need to sign in first.");
    }
    return token;
  }

  private async postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response, "Request failed."));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async readError(response: Response, fallback: string): Promise<string> {
    try {
      const payload = (await response.json()) as { message?: string; detail?: string };
      return payload.message || payload.detail || fallback;
    } catch {
      return fallback;
    }
  }
}
