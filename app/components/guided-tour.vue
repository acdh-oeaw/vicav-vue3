<script setup lang="ts">
import type { AttachableElement, StepEntity } from "v-onboarding";
import { ref } from "vue";

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
const stepDefinitions: Array<TourStep> = [
	{
		attachTo: { element: "#results-table" },
		content: {
			title: "The Variety Table",
			description:
				"Every row is a documented language variety: a city, a region, or a community. This table is your starting point, and whatever you filter here is what the map beside it shows.",
		},
	},
	{
		attachTo: { element: "#results-table tbody tr:first-child" },
		requireClick: true,
		content: {
			title: "Find a Variety on the Map",
			description:
				"Click anywhere in a row to select that variety. The map view centers and zooms in on its location, so table and map always talk about the same place.",
		},
	},
	{
		attachTo: { element: '#results-table tbody tr:first-child [data-onboarding="location-link"]' },
		requireClick: true,
		content: {
			title: "Open a Variety",
			description:
				"Click the name of the variety to open it in its own window, listing every feature recorded for that location together with the values attested there.",
		},
	},
	{
		attachTo: { element: '[data-window-type="Location"] [data-onboarding="feature-link"]' },
		requireClick: true,
		content: {
			title: "From Variety to Feature",
			description:
				"In that window every feature name is a link. Click one to open its statistics: how the values of this feature are distributed across all varieties, not just this one.",
		},
	},
	{
		attachTo: { element: '[data-window-type="Location"] [data-onboarding="feature-value-link"]' },
		requireClick: true,
		content: {
			title: "From Variety to Feature Value",
			description:
				"The values themselves are links too. Click one to open the individual observation behind it, with the people recorded, the metadata collected, and the source it came from.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="windows-menu"]' },
		content: {
			title: "Getting Cluttered?",
			description:
				"Every view opens as its own window, so a few clicks fill the screen quickly. This menu lists all open windows and brings one back to the front; the × in a window's title bar closes it again.",
		},
	},
	{
		attachTo: {
			element: '[data-window-type="FeatureValue"] [data-onboarding="feature-value-source"]',
		},
		content: {
			title: "Where a Value Comes From",
			description:
				"Each observation names its source, either a publication or a fieldwork campaign. Following that link is what makes a value verifiable and citable.",
		},
	},
	{
		attachTo: { element: '[data-window-type="FeatureValue"] [data-onboarding="show-on-map"]' },
		requireClick: true,
		waitTimeout: 60_000,
		content: {
			title: "Show on Map",
			description:
				'Click "Show on map" to turn this single observation into a query: table and map are filtered down to every variety that attests this feature value.',
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-category-count"]' },
		settleDelay: 1_000,
		content: {
			title: "A (1) Appeared",
			description:
				"Look at the feature menus in the map toolbar: one of them now carries a badge. Each menu counts how many of its features are part of the current query.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-category-count"]' },
		requireClick: true,
		waitTimeout: 60_000,
		content: {
			title: "Back to the Whole Feature",
			description:
				"Open that menu and click the feature with the badge. The query only holds the one value you came from, so let's look at all of them.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-value-picker"]' },
		requireClick: '[data-onboarding="save-feature-values"]',
		content: {
			title: "Select All Values",
			description:
				'Here every attested value is listed with the number of varieties using it. Click "Select all values" to put the complete feature on the map, then "Save changes".',
		},
	},
	{
		attachTo: { element: '[data-onboarding="map-legend"]' },
		options: { popper: { placement: "right" } },
		content: {
			title: "Customize Your Markers",
			description:
				"The legend lists every value now drawn on the map. Click the marker in front of a value to give it a different shape or color, or to hide it from the map entirely.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="legend-value"]' },
		options: { popper: { placement: "right" } },
		content: {
			title: "Group Values Together",
			description:
				"Too many values to tell apart? Drag one value onto another to merge them into a group that shares a single marker. Groups can be renamed, extended by dragging more values in, and dissolved again.",
		},
	},
	{
		attachTo: { element: "#results-table" },
		content: {
			title: "Groups Carry Over",
			description:
				"Back in the table the grouped values now appear under the group's name and marker, so the reading you built on the map is the one you get in the data.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="table-actions"]' },
		content: {
			title: "Details and Export",
			description:
				'"Show details" expands the metadata behind each value directly in the table instead of opening a window per value. "Export data" downloads the current selection as CSV or Excel, filters included.',
		},
	},
	{
		attachTo: { element: '[data-onboarding="filter-metadata"]' },
		content: {
			title: "Metadata Filters",
			description:
				"These filters narrow the data by who was recorded rather than by language: source, religion, tribe, age group, gender, and first language. They apply to the features already in your query.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-categories"]' },
		content: {
			title: "Add a Second Feature",
			description:
				"Now pick a second feature from any of these categories and select a few of its values. Combining features is where querying this data gets interesting.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="query-input"]' },
		content: {
			title: "Your Query, Assembled",
			description:
				"Everything you selected is collected here as chips, both features side by side. Click a chip to change it, or the × to drop it again.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="query-operator"]' },
		content: {
			title: "OR or AND",
			description:
				"Features are joined with OR by default: a variety qualifies if it matches either of them. Switch this to AND to keep only the varieties that attest both.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="main-navigation"]' },
		content: {
			title: "That's the Tour",
			description:
				"You have seen how table, map, and windows work together, and how filtering keeps them in sync. For query syntax, the data model, and where the material comes from, see the manual in the menu above.",
		},
	},
];

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
				console.log("delay is over", step);
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
