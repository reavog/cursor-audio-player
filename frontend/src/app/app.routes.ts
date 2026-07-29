import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./core/auth/auth.guard";
import { ForgotPassword } from "./features/auth/forgot-password/forgot-password";
import { Login } from "./features/auth/login/login";
import { OtpVerify } from "./features/auth/otp-verify/otp-verify";
import { Register } from "./features/auth/register/register";
import { PlaylistDetail } from "./playlist-detail/playlist-detail";
import { Playlists } from "./playlists/playlists";
import { Tracks } from "./tracks/tracks";

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
    component: Tracks,
    canActivate: [authGuard],
  },
  {
    path: "playlists",
    component: Playlists,
    canActivate: [authGuard],
  },
  {
    path: "playlists/:id",
    component: PlaylistDetail,
    canActivate: [authGuard],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
