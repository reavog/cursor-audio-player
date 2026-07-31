import { Injectable, computed, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PlayerUiService {
  private readonly sidebarCollapsedSignal = signal(false);
  private readonly sidebarDrawerOpenSignal = signal(false);
  private readonly queueDrawerOpenSignal = signal(false);
  private readonly nowPlayingSheetOpenSignal = signal(false);

  readonly sidebarCollapsed = this.sidebarCollapsedSignal.asReadonly();
  readonly sidebarDrawerOpen = this.sidebarDrawerOpenSignal.asReadonly();
  readonly queueDrawerOpen = this.queueDrawerOpenSignal.asReadonly();
  readonly nowPlayingSheetOpen = this.nowPlayingSheetOpenSignal.asReadonly();

  readonly isSidebarExpanded = computed(
    () => !this.sidebarCollapsedSignal() || this.sidebarDrawerOpenSignal(),
  );

  toggleSidebarCollapsed(): void {
    this.sidebarCollapsedSignal.update((value) => !value);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSignal.set(collapsed);
  }

  openSidebarDrawer(): void {
    this.sidebarDrawerOpenSignal.set(true);
  }

  closeSidebarDrawer(): void {
    this.sidebarDrawerOpenSignal.set(false);
  }

  toggleSidebarDrawer(): void {
    this.sidebarDrawerOpenSignal.update((value) => !value);
  }

  openQueueDrawer(): void {
    this.nowPlayingSheetOpenSignal.set(false);
    this.queueDrawerOpenSignal.set(true);
  }

  closeQueueDrawer(): void {
    this.queueDrawerOpenSignal.set(false);
  }

  toggleQueueDrawer(): void {
    if (this.queueDrawerOpenSignal()) {
      this.closeQueueDrawer();
      return;
    }

    this.openQueueDrawer();
  }

  openNowPlayingSheet(): void {
    this.queueDrawerOpenSignal.set(false);
    this.sidebarDrawerOpenSignal.set(false);
    this.nowPlayingSheetOpenSignal.set(true);
  }

  closeNowPlayingSheet(): void {
    this.nowPlayingSheetOpenSignal.set(false);
  }

  toggleNowPlayingSheet(): void {
    if (this.nowPlayingSheetOpenSignal()) {
      this.closeNowPlayingSheet();
      return;
    }

    this.openNowPlayingSheet();
  }
}
