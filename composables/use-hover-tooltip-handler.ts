import { ref } from "vue";

const tooltipContent = ref(null);
const showTooltip = ref(null);
const tooltipX = ref("");
const tooltipY = ref("");

export function useHoverTooltipHandler() {
	return {
		tooltipContent,
		showTooltip,
		tooltipX,
		tooltipY,
		handleHoverTooltip: function (event: MouseEvent) {
			{
				const element =
					event.target.nodeName === "SPAN"
						? (event.target as HTMLSpanElement)
						: (event.target.parentNode as HTMLSpanElement);
				if (element.dataset.tooltip) {
					//					const position = element.getBoundingClientRect();
					tooltipContent.value = element.dataset.tooltip;
					tooltipX.value = event.layerX;
					tooltipY.value = event.layerY;
					showTooltip.value = true;
				}
			}
		},
	};
}
