export function useElementDimensions(element: Ref<HTMLElement | null>): Ref<DOMRect | null> {
	const dimensions = ref<DOMRect | null>(null);

	const observer = new ResizeObserver((entries) => {
		const [entry] = entries;
		if (entry == null) return;
		dimensions.value = entry.contentRect;
	});

	onMounted(() => {
		if (element.value == null) return;
		observer.observe(element.value);
	});

	onUnmounted(() => {
		observer.disconnect();
	});

	return dimensions;
}
