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

function isFocusableFormElement(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.tabIndex === -1) return false;
  if (element instanceof HTMLInputElement && ["hidden"].includes(element.type)) return false;
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement ||
    element instanceof HTMLTextAreaElement
  );
}

export function handleFormEnterNavigation(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Enter" || event.shiftKey) return;

  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target instanceof HTMLTextAreaElement) return;

  const form = target.closest("form");
  if (!(form instanceof HTMLFormElement)) return;

  const focusableElements = Array.from(
    form.querySelectorAll("input, select, button, textarea")
  ).filter(isFocusableFormElement);

  const currentIndex = focusableElements.indexOf(target);
  if (currentIndex === -1) return;

  event.preventDefault();

  const nextElement = focusableElements
    .slice(currentIndex + 1)
    .find((element) => !(element instanceof HTMLButtonElement && element.type === "button"));

  if (nextElement) {
    focusAndSelect(nextElement, !(nextElement instanceof HTMLButtonElement));
    return;
  }

  form.requestSubmit();
}
