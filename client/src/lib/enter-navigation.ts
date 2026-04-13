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
  
  // Basic checks
  if (element.hasAttribute("disabled")) return false;
  if (element.hasAttribute("hidden")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.tabIndex === -1) return false;
  if (getComputedStyle(element).display === 'none') return false;
  if (getComputedStyle(element).visibility === 'hidden') return false;

  // Type checks
  if (element instanceof HTMLInputElement && ["hidden"].includes(element.type)) return false;

  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement ||
    element instanceof HTMLTextAreaElement ||
    element.getAttribute('role') === 'combobox' ||
    element.isContentEditable
  );
}

export function handleFormEnterNavigation(event: React.KeyboardEvent<HTMLElement> | KeyboardEvent) {
  // Only handle Enter without Shift
  if (event.key !== "Enter" || event.shiftKey) return;

  const target = event.target as HTMLElement | null;
  if (!target) return;

  // Don't interfere with textareas, links, or actual buttons (except submit buttons)
  if (target instanceof HTMLTextAreaElement) return;
  if (target.tagName === 'A') return;
  // If target is a button and not a submit button, don't move focus
  if (target instanceof HTMLButtonElement && target.type !== 'submit') return;

  // Find the container: nearest form, or nearest dialog, or just the body
  const container = target.closest("form") || target.closest('[role="dialog"]') || document.body;
  
  // Find all focusable elements in the container
  const focusableElements = Array.from(
    container.querySelectorAll("input, select, button, textarea, [role='combobox']")
  ).filter(isFocusableFormElement);

  const currentIndex = focusableElements.indexOf(target);
  if (currentIndex === -1) return;

  // Prevent default Enter behavior
  event.preventDefault();

  // Find the next element
  const nextElement = focusableElements
    .slice(currentIndex + 1)
    .find((element) => {
        // Skip buttons that are just "button" types - we want inputs/selects or the final submit button
        if (element instanceof HTMLButtonElement && element.type === "button") return false;
        // Skip hidden or un-tabbable elements
        if (element.tabIndex < 0) return false;
        return true;
    });

  if (nextElement) {
    focusAndSelect(nextElement, !(nextElement instanceof HTMLButtonElement));
    return;
  }

  // If no next element, try to trigger a click on the primary action button
  // 1. Look for a submit button in the container
  const submitButton = focusableElements.find(el => el instanceof HTMLButtonElement && el.type === 'submit') as HTMLButtonElement | undefined;
  if (submitButton) {
      submitButton.click();
      return;
  }

  // 2. Look for a "Create" or "Save" button in the container (common in dialogs)
  const primaryAction = Array.from(container.querySelectorAll("button")).find(btn => {
      const text = btn.innerText.toLowerCase();
      return text.includes("create") || text.includes("save") || text.includes("submit") || text.includes("update");
  });
  if (primaryAction) {
      primaryAction.click();
      return;
  }

  // 3. Fallback to form requestSubmit if it's a form
  if (container instanceof HTMLFormElement) {
      container.requestSubmit();
  }
}
