<script setup lang="ts">
import type { AttachableElement, StepEntity } from "v-onboarding";
import { ref } from "vue";

import stepDefinitionData from "@/assets/guidedTourSteps.json";

interface TourStep extends StepEntity {
	/**
	 * When set, the step does not offer a "Next" button and the tour only advances once the user
	 * has clicked something: the element the step is attached to (`true`), or the element named
	 * here — useful when the step highlights a whole panel but hinges on one button inside it.
	 */
	requireClick?: boolean | AttachableElement;
	/**
	 * How long to wait for the step's element to turn up before giving up on the step, in
	 * milliseconds. Raise it where the user has to work through a menu or a dialog first.
	 */
	waitTimeout?: number;
	/**
	 * How long to let the layout settle before the step is positioned, in milliseconds. Raise it
	 * for steps that follow an interaction with a lot of reflow behind it.
	 */
	settleDelay?: number;
}

/** Long enough to survive a window opening and rendering, short enough not to feel stuck. */
const DEFAULT_WAIT_TIMEOUT = 10_000;
/**
 * Opening a window re-tiles the ones already on screen, and the arrangement runs behind a 150ms
 * debounce. v-onboarding refreshes its cut-out on scroll and on resize only, so an element that is
 * merely moved leaves the highlight behind: let the shuffling finish before positioning the step.
 */
const DEFAULT_SETTLE_DELAY = 400;

const wrapper = ref();
const stepDefinitions = stepDefinitionData as Array<TourStep>;

function resolveElement(target: AttachableElement): HTMLElement | null {
	const element =
		typeof target === "string"
			? document.querySelector(target)
			: typeof target === "function"
				? target()
				: unref(target);
	return element instanceof HTMLElement ? element : null;
}

/**
 * Steps attach to elements that only exist once the user has opened the right window or dialog,
 * so a step waits for its element instead of silently attaching to nothing.
 */
function waitForElement(target: AttachableElement, timeout: number) {
	return new Promise<HTMLElement | null>((resolve) => {
		const found = resolveElement(target);
		if (found) {
			resolve(found);
			return;
		}

		const settle = (element: HTMLElement | null) => {
			clearTimeout(timer);
			observer.disconnect();
			resolve(element);
		};
		const observer = new MutationObserver(() => {
			const element = resolveElement(target);
			if (element) settle(element);
		});
		const timer = setTimeout(() => {
			settle(null);
		}, timeout);

		observer.observe(document.body, { childList: true, subtree: true });
	});
}

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Leaves the step at `index`, finishing the tour when it was the last one. Deferred by a task so
 * the application can handle the click that triggered it and re-render first.
 */
function leaveStep(index: number, direction: number) {
	setTimeout(() => {
		const target = index + direction;
		if (target >= stepDefinitions.length) wrapper.value?.finish();
		else if (target >= 0) wrapper.value?.goToStep(target);
	}, 0);
}

/** Advances the tour as soon as `target` is clicked. Returns the matching teardown. */
function advanceOnClick(target: AttachableElement, index: number) {
	let handled = false;
	const onClick = (event: MouseEvent) => {
		if (handled || !(event.target instanceof Node)) return;
		const element = resolveElement(target);
		if (!element?.contains(event.target)) return;
		handled = true;
		leaveStep(index, 1);
	};

	// Capture phase, so the click is registered even if the application stops its propagation.
	document.addEventListener("click", onClick, true);
	return () => {
		document.removeEventListener("click", onClick, true);
	};
}

function prepareStep(step: TourStep, index: number): StepEntity {
	const { requireClick, settleDelay, waitTimeout, ...entity } = step;
	let teardown: (() => void) | null = null;

	return {
		...entity,
		options: {
			...entity.options,
			// keeps the tooltip from flashing at the previous position while `beforeStep` waits
			hideNextStepDuringHook: true,
			hideButtons: { ...entity.options?.hideButtons, next: Boolean(requireClick) },
		},
		on: {
			...entity.on,
			beforeStep: async (options) => {
				const element = await waitForElement(
					entity.attachTo.element,
					waitTimeout ?? DEFAULT_WAIT_TIMEOUT,
				);
				if (!element) {
					// Nothing to point at, and with the "Next" button possibly hidden there would be no
					// way out of the step either, so move along instead of stranding the user.
					leaveStep(index, options?.direction ?? 1);
					return;
				}
				await entity.on?.beforeStep?.(options);
				// the click that got us here may still be opening or re-tiling windows around the element
				await delay(settleDelay ?? DEFAULT_SETTLE_DELAY);
				if (requireClick) {
					teardown = advanceOnClick(
						requireClick === true ? entity.attachTo.element : requireClick,
						index,
					);
				}
			},
			afterStep: async (options) => {
				teardown?.();
				teardown = null;
				await entity.on?.afterStep?.(options);
			},
		},
	};
}

const steps = stepDefinitions.map(prepareStep);

onMounted(() => {
	wrapper.value?.start();
});
</script>

<template>
	<Teleport :to="'body'">
		<VOnboardingWrapper
			ref="wrapper"
			class="z-110"
			:options="{
				scrollToStep: { enabled: false },
				// the tour talks the user through clicking the application itself, so the overlay may
				// not swallow those clicks: v-onboarding's interaction lock also installs a focus trap
				// that cancels every click outside the tooltip
				overlay: { preventOverlayInteraction: false },
			}"
			:steps="steps"
	/></Teleport>
</template>
