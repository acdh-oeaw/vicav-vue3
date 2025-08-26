import { assert } from "@acdh-oeaw/lib";
import * as htmlToImage from "html-to-image";

/**
 * Composable to export a DOM node as PNG, fixing CSS variables and SVG <use> issues.
 */
export function useHtmlToImageExport() {
	// Inline CSS variables for SVG elements using var(--...)
	function addInlineCSSVariables(node: HTMLElement) {
		const styles = document.documentElement.attributeStyleMap;
		for (const style of styles)
			if (style[0].startsWith("--")) {
				for (const val of style[1]) node.style.setProperty(style[0], val.toString());
			}
	}
	function removeInlineCSSVariables(node: HTMLElement) {
		const styles = document.documentElement.attributeStyleMap;
		for (const style of styles) if (style[0].startsWith("--")) node.style.removeProperty(style[0]);
	}

	// Export node as PNG
	async function exportNodeAsPng(
		node: HTMLElement,
		format = "png",
		filename = `${window.location.host} - ${Date.now().toString()}`,
	) {
		const svgSymbols = document.querySelector("#svg-symbols");
		let originalSymbolParent = null;
		if (svgSymbols) {
			originalSymbolParent = svgSymbols.parentElement;
			assert(originalSymbolParent != null);
			originalSymbolParent.removeChild(svgSymbols);
			node.appendChild(svgSymbols);
		}
		addInlineCSSVariables(node);

		try {
			let dataUrl;
			switch (format) {
				case "png":
					dataUrl = await htmlToImage.toPng(node);
					break;
				case "jpg":
					dataUrl = await htmlToImage.toJpeg(node);
					break;
				case "svg":
					dataUrl = await htmlToImage.toSvg(node);
					break;
				default:
					dataUrl = await htmlToImage.toPng(node);
					break;
			}
			const link = document.createElement("a");
			link.download = `${filename}.${format}`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error("Error during image export", error);
		} finally {
			removeInlineCSSVariables(node);
			if (svgSymbols && originalSymbolParent) {
				node.removeChild(svgSymbols);
				originalSymbolParent.appendChild(svgSymbols);
			}
		}
	}

	return { exportNodeAsPng };
}
