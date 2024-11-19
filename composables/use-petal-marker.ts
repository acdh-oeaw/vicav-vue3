import { divIcon, type LatLng, marker } from "leaflet";

//@ts-expect-error asset not found
import petal from "~/assets/petal.svg?raw";

const sampleColors = [
	"#555b6e",
	"#6f868e",
	"#89b0ae",
	"#a4cac5",
	"#bee3db",
	"#CF9997",
	"#C14444",
	"#ffd6ba",
];

function getPetalSVG() {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative size-6";
	const NUM_PETALS = Math.round(Math.random() * 12) + 1;
	for (let i = 0; i < NUM_PETALS; i++) {
		const svg = document.createElement("svg");
		svg.setHTMLUnsafe(String(petal));
		svg.setAttribute("fill", sampleColors[i % sampleColors.length] ?? "#cccccc");
		svg.style.transformOrigin = "bottom";
		svg.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg)`;
		svg.className = "size-3 absolute ml-1.5";
		div.appendChild(svg);
	}

	return div;
}

export function usePetalMarker(_geoJSONPoint: unknown, latlng: LatLng) {
	const htmlContent = getPetalSVG().outerHTML; // Example HTML content
	const customIcon = divIcon({
		html: htmlContent,
		className: "custom-marker-icon size-5", // Add custom CSS class for styling
		// iconSize: [30, 30], // Adjust size as needed
	});

	const leafletMarker = marker(latlng, {
		icon: customIcon,
	});
	return leafletMarker;
}
