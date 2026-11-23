<script setup lang="ts">
import type { AttachableElement, StepEntity } from "v-onboarding";
import { ref } from "vue";

const { data: projectData } = useProjectInfo();
let stepDefinitionData = projectData.value?.projectConfig?.staticData?.table?.slice(-1)[0] ?? [];
if (!Array.isArray(stepDefinitionData) || !stepDefinitionData[0]?.attachTo) stepDefinitionData = [];

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

const clickTargets = new Map<number, AttachableElement>();

/**
 * Reka's dropdown and menubar triggers open on `pointerdown`, not on `click`.
 */
function simulateClick(element: HTMLElement) {
	const { left, top, width, height } = element.getBoundingClientRect();
	const init = {
		bubbles: true,
		cancelable: true,
		composed: true,
		view: window,
		button: 0,
		clientX: left + width / 2,
		clientY: top + height / 2,
	};
	const pointer = { ...init, pointerId: 1, pointerType: "mouse", isPrimary: true };

	const proceed = element.dispatchEvent(
		new PointerEvent("pointerdown", { ...pointer, buttons: 1 }),
	);
	// as in the browser, a cancelled `pointerdown` suppresses the compatibility mouse events
	if (proceed) element.dispatchEvent(new MouseEvent("mousedown", { ...init, buttons: 1 }));
	element.dispatchEvent(new PointerEvent("pointerup", pointer));
	if (proceed) element.dispatchEvent(new MouseEvent("mouseup", init));
	element.click();
}

function interact(index: number, next: () => void) {
	const target = clickTargets.get(index);
	const element = target ? resolveElement(target) : null;
	if (element) simulateClick(element);
	else next();
}

function prepareStep(step: TourStep, index: number): StepEntity {
	const { requireClick, settleDelay, waitTimeout, ...entity } = step;
	let teardown: (() => void) | null = null;
	if (requireClick) {
		clickTargets.set(index, requireClick === true ? entity.attachTo.element : requireClick);
	}

	return {
		...entity,
		options: {
			...entity.options,
			// keeps the tooltip from flashing at the previous position while `beforeStep` waits
			hideNextStepDuringHook: true,
		},
		on: {
			...entity.on,
			beforeStep: async (options) => {
				const element = await waitForElement(
					entity.attachTo.element,
					waitTimeout ?? DEFAULT_WAIT_TIMEOUT,
				);
				if (!element) {
					// Nothing to point at, and nothing to click either if the step waits for a click, so
					// move along instead of stranding the user.
					leaveStep(index, options?.direction ?? 1);
					return;
				}
				await entity.on?.beforeStep?.(options);
				// the click that got us here may still be opening or re-tiling windows around the element
				await delay(settleDelay ?? DEFAULT_SETTLE_DELAY);
				const target = clickTargets.get(index);
				if (target) teardown = advanceOnClick(target, index);
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
	if (!(sessionStorage.getItem("tourDismissed") || localStorage.getItem("tourCompleted")))
		wrapper.value?.start();
});

let exited = false;
function onFinish() {
	if (exited) return;
	localStorage.setItem("tourCompleted", "true");
}
function onExit() {
	exited = true;
	sessionStorage.setItem("tourDismissed", "true");
}
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
			@exit="onExit"
			@finish="onFinish"
		>
			<template #default="{ step, next, previous, exit, isFirst, isLast, index }">
				<VOnboardingStep>
					<div class="v-onboarding-item">
						<div class="v-onboarding-item__header">
							<span v-if="step.content.title" class="v-onboarding-item__header-title">
								{{ step.content.title }}
							</span>
							<button
								v-if="!step.options?.hideButtons?.exit"
								aria-label="Close"
								class="v-onboarding-item__header-close"
								@click="
									exit();
									wrapper?.finish();
								"
							>
								<svg
									class="size-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M6 18L18 6M6 6l12 12"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
							</button>
						</div>
						<!-- eslint-disable vue/no-v-html -- tour content comes from the project config -->
						<p
							v-if="step.content.description && step.content.html"
							class="v-onboarding-item__description"
							v-html="step.content.description"
						/>
						<!-- eslint-enable vue/no-v-html -->
						<p v-else-if="step.content.description" class="v-onboarding-item__description">
							{{ step.content.description }}
						</p>
						<div class="v-onboarding-item__actions">
							<button
								v-if="!isFirst && !step.options?.hideButtons?.previous"
								class="v-onboarding-btn-secondary"
								type="button"
								@click="previous"
							>
								Previous
							</button>
							<template v-if="!step.options?.hideButtons?.next">
								<button
									v-if="clickTargets.has(index)"
									class="v-onboarding-btn-primary"
									title="Click the highlighted element, or let this button do it for you"
									type="button"
									@click="interact(index, next)"
								>
									Interact
								</button>
								<button v-else class="v-onboarding-btn-primary" type="button" @click="next">
									{{ isLast ? "Finish" : "Next" }}
								</button>
							</template>
						</div>
					</div>
				</VOnboardingStep>
			</template>
		</VOnboardingWrapper></Teleport
	>
</template>

<style scoped>
* {
	--v-onboarding-step-z: 110;
}
</style>
