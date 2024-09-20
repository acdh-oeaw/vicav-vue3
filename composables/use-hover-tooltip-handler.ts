import { ref } from "vue";

export function useHoverTooltipHandler(tooltip: Ref<HTMLElement | undefined>) {
	const tooltipContent: Ref<string | null> = ref(null);
	const showTooltip: Ref<boolean | null> = ref(null);

	return {
		tooltipContent,
		showTooltip,
		handleHoverTooltip: (event: MouseEvent) => {
			{
				const element =
					//@ts-expect-error TODO: fix this - nodeName does not exist on EventTarget
					event.target!.nodeName === "SPAN"
						? (event.target as HTMLSpanElement)
						: //@ts-expect-error TODO: fix this - parentNode does not exist on EventTarget
							(event.target!.parentNode as HTMLSpanElement);
				if (element.dataset.tooltip) {
					tooltipContent.value = element.dataset.tooltip;
					showTooltip.value = true;
					element.parentNode?.appendChild(tooltip.value!);
				} else {
					showTooltip.value = false;
				}
			}
		},
	};
}
