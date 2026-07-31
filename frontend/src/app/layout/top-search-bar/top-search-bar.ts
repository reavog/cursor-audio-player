import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { filter } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { IconButton } from "../../shared/components/icon-button/icon-button";

@Component({
  selector: "app-top-search-bar",
  imports: [FormsModule, IconButton],
  templateUrl: "./top-search-bar.html",
  styleUrls: ["./top-search-bar.scss"],
})
export class TopSearchBar {
  @ViewChild("accountRoot") private accountRoot?: ElementRef<HTMLElement>;
  @ViewChild("accountButton") private accountButton?: ElementRef<HTMLButtonElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpenRequested = output<void>();
  readonly searchSubmitted = output<string>();

  readonly query = signal("");
  readonly username = computed(() => this.authService.user()?.username ?? "Account");
  readonly accountMenuOpen = signal(false);

  constructor() {
    this.syncQueryFromRoute();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncQueryFromRoute());
  }

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

  closeAccountMenu(): void {
    if (!this.accountMenuOpen()) {
      return;
    }

    this.accountMenuOpen.set(false);
    queueMicrotask(() => this.accountButton?.nativeElement.focus());
  }

  logout(): void {
    this.accountMenuOpen.set(false);
    this.authService.logout();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.closeAccountMenu();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.accountMenuOpen()) {
      return;
    }

    const root = this.accountRoot?.nativeElement;
    const target = event.target;
    if (root && target instanceof Node && !root.contains(target)) {
      this.closeAccountMenu();
    }
  }

  private syncQueryFromRoute(): void {
    const treeUrl = this.router.url.split("?")[0];
    if (treeUrl !== "/search" && !treeUrl.endsWith("/search")) {
      return;
    }

    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    this.query.set(route.snapshot.queryParamMap.get("q") ?? "");
  }
}
