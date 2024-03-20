import { ref } from "vue";

const tooltipContent = ref(null);
const showTooltip = ref(null);

export function useHoverTooltipHandler(tooltip: MaybeRef<HTMLDivElement>) {
	return {
		tooltipContent,
		showTooltip,
		handleHoverTooltip: (event: MouseEvent) => {
			{
				const element =
					event.target.nodeName === "SPAN"
						? (event.target as HTMLSpanElement)
						: (event.target.parentNode as HTMLSpanElement);
				if (element.dataset.tooltip) {
					tooltipContent.value = element.dataset.tooltip;
					showTooltip.value = true;
					element.parentNode?.appendChild(tooltip.value);
				}
			}
		},
	};
}
