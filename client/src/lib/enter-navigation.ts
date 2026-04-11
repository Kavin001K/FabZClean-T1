import type React from "react";

type NavigateOnEnterOptions = {
  next?: HTMLElement | null;
  selectText?: boolean;
  submit?: (() => void) | null;
};

export function focusAndSelect(element?: HTMLElement | null, selectText = true) {
  if (!element) return;
  element.focus();
  if (selectText && element instanceof HTMLInputElement) {
    element.select();
  }
}

export function navigateOnEnter(
  event: React.KeyboardEvent<HTMLElement>,
  options: NavigateOnEnterOptions = {}
) {
  if (event.key !== "Enter" || event.shiftKey) return;

  const target = event.target as HTMLElement | null;
  if (target instanceof HTMLTextAreaElement) return;

  event.preventDefault();

  if (options.next) {
    focusAndSelect(options.next, options.selectText ?? true);
    return;
  }

  if (options.submit) {
    options.submit();
    return;
  }

  const form = target?.closest("form");
  if (form instanceof HTMLFormElement) {
    form.requestSubmit();
  }
}
