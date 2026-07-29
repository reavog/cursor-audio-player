import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./core/auth/auth.guard";
import { ForgotPassword } from "./features/auth/forgot-password/forgot-password";
import { Login } from "./features/auth/login/login";
import { OtpVerify } from "./features/auth/otp-verify/otp-verify";
import { Register } from "./features/auth/register/register";
import { AppShell } from "./layout/app-shell/app-shell";
import { LibraryPage } from "./features/library/library-page";
import { SearchPage } from "./features/search/search-page";
import { PlaylistsPage } from "./features/playlists/playlists-page";
import { PlaylistDetailPage } from "./features/playlists/playlist-detail-page";
import { QueuePage } from "./features/queue/queue-page";

export const routes: Routes = [
  {
    path: "login",
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: "register",
    component: Register,
    canActivate: [guestGuard],
  },
  {
    path: "forgot-password",
    component: ForgotPassword,
    canActivate: [guestGuard],
  },
  {
    path: "otp",
    component: OtpVerify,
    canActivate: [guestGuard],
  },
  {
    path: "",
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        component: LibraryPage,
      },
      {
        path: "search",
        component: SearchPage,
      },
      {
        path: "playlists",
        component: PlaylistsPage,
      },
      {
        path: "playlists/:id",
        component: PlaylistDetailPage,
      },
      {
        path: "queue",
        component: QueuePage,
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
