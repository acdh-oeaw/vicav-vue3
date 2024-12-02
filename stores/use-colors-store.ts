import { debounce } from "@acdh-oeaw/lib";

interface Color {
	id: string;
	colorCode: string;
}

export const useColorsStore = defineStore("colors", () => {
	const colors = ref<Record<Color["id"], Color>>({});
	function updateColorValue(color: Color) {
		colors.value[color.id] = color;
	}

	function updateCssVariable(color: Color) {
		document.documentElement.style.setProperty(`--${color.id}`, color.colorCode);
	}

	const colorUpdateDebounce = debounce((color: Color) => {
		updateColorValue(color);
	}, 500);

	function addColor(color: Color) {
		updateCssVariable(color);
		colorUpdateDebounce(color);
	}

	function removeColor(id: Color["id"]) {
		document.documentElement.style.removeProperty(`--${id}`);
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete colors.value[id];
	}

	return {
		addColor,
		removeColor,
		colors,
	};
});
