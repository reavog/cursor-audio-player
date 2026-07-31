/**
 * Lightweight focus trap for drawers/sheets without Angular CDK.
 * Returns a cleanup function that removes listeners.
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  const getFocusable = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !element.hasAttribute("disabled") && element.offsetParent !== null,
    );

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);
  return () => container.removeEventListener("keydown", onKeyDown);
}
