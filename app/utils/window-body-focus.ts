import { nextTick } from "vue";

const interactiveContentSelector = [
	"a[href]",
	"button",
	"details",
	"input",
	"label",
	"select",
	"summary",
	"textarea",
	"[contenteditable='']",
	"[contenteditable='plaintext-only']",
	"[contenteditable='true']",
	"[role='button']",
	"[role='checkbox']",
	"[role='combobox']",
	"[role='link']",
	"[role='listbox']",
	"[role='menuitem']",
	"[role='option']",
	"[role='textbox']",
	"[tabindex]:not([tabindex='-1'])",
].join(", ");

function shouldPreserveFocusTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;

	return target.closest(interactiveContentSelector) != null;
}

// because our various window type wrap scrollable content differently, we need to
// search for the nearest scrollable container first.
function isScrollable(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	const overflowY = style.overflowY || element.style.overflowY;
	const overflowX = style.overflowX || element.style.overflowX;
	const canScrollY =
		(overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
		element.scrollHeight > element.clientHeight;
	const canScrollX =
		(overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
		element.scrollWidth > element.clientWidth;

	return canScrollY || canScrollX;
}

function getKeyboardScrollFocusTarget(body: HTMLElement, target?: EventTarget | null): HTMLElement {
	if (!(target instanceof HTMLElement)) {
		const candidates = [body, ...body.querySelectorAll<HTMLElement>("*")];
		return candidates.find((element) => isScrollable(element)) ?? body;
	}

	let element: HTMLElement | null = target;

	//ascending to the first scrollable container, ultimately return body
	while (element != null && element !== body) {
		if (isScrollable(element)) return element;

		element = element.parentElement;
	}

	return body;
}

function focusKeyboardScrollTarget(body: HTMLElement, target?: EventTarget | null): void {
	if (shouldPreserveFocusTarget(target ?? null)) return;

	const focusTarget = getKeyboardScrollFocusTarget(body, target);
	if (focusTarget.tabIndex < 0) {
		focusTarget.tabIndex = -1;
	}
	focusTarget.focus({ preventScroll: true });
}

export async function focusWindowBodyKeyboardScrollTargetAfterRender(
	body: HTMLElement,
): Promise<void> {
	await nextTick();
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve();
		});
	});

	focusKeyboardScrollTarget(body);
}

export function enableWindowBodyKeyboardScrollFocus(body: HTMLElement): void {
	body.tabIndex = -1;

	body.addEventListener("pointerdown", (event) => {
		focusKeyboardScrollTarget(body, event.target);
	});
}
