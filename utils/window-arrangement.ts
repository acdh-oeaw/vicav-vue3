import type WinBox from "winbox";

import type { WindowItem } from "@/types/global.d";

export function cascade(viewport: DOMRect, windows: Array<WindowItem>): void {
	const windowWidth = Math.floor(viewport.width / 2);
	const windowHeight = Math.floor(viewport.height / 2);

	const sorted = windows.slice().sort((a, z) => a.winbox.index - z.winbox.index);

	sorted.forEach((item, index) => {
		const x = index * 40 > viewport.width - windowWidth ? viewport.width - windowWidth : index * 40;
		const y =
			index * 40 > viewport.height - windowHeight ? viewport.height - windowHeight : index * 40;

		item.winbox.resize(windowWidth, windowHeight).move(x, y);
		removeWindowControls(item.winbox);
	});
}

export function maximize(viewport: DOMRect, windows: Array<WindowItem>): void {
	windows.forEach((item) => {
		item.winbox.resize(viewport.width, viewport.height).move(0, 0);
		removeWindowControls(item.winbox);
	});
}

export function none(viewport: DOMRect, windows: Array<WindowItem>): void {
	windows.forEach((item) => {
		addWindowControls(item.winbox);
	});
}

export function smartTile(viewport: DOMRect, windows: Array<WindowItem>): void {
	const N = windows.length;
	const floorSqrtN = Math.floor(Math.sqrt(N));
	const innerSquare = Math.pow(floorSqrtN, 2);
	const isExtraRow = N - innerSquare > floorSqrtN;
	const extraColumnHeight = N - innerSquare - (isExtraRow ? floorSqrtN : 0);
	const upperBlockSize = (floorSqrtN + 1) * extraColumnHeight;

	windows.forEach((item, index) => {
		const columnNumber =
			index > upperBlockSize - 1 ? (index - upperBlockSize) % floorSqrtN : index % (floorSqrtN + 1);
		const rowNumber =
			index > upperBlockSize - 1
				? extraColumnHeight + Math.floor((index - upperBlockSize) / floorSqrtN)
				: Math.floor(index / (floorSqrtN + 1));
		const windowWidth = Math.floor(
			viewport.width / (index > upperBlockSize - 1 ? floorSqrtN : floorSqrtN + 1),
		);
		const windowHeight = Math.floor(viewport.height / (isExtraRow ? floorSqrtN + 1 : floorSqrtN));

		item.winbox
			.resize(windowWidth, windowHeight)
			.move(windowWidth * columnNumber, windowHeight * rowNumber);
		removeWindowControls(item.winbox);
	});
}

export function tile(viewport: DOMRect, windows: Array<WindowItem>): void {
	const N = windows.length;
	const cols = Math.floor(Math.sqrt(N - 1)) + 1;
	const rows = Math.ceil(N / cols);
	const windowWidth = Math.floor(viewport.width / cols);
	const windowHeight = Math.floor(viewport.height / rows);

	windows.forEach((item, index) => {
		const x = windowWidth * (index % cols);
		const y = windowHeight * Math.floor(index / cols);

		item.winbox.resize(windowWidth, windowHeight).move(x, y);
		removeWindowControls(item.winbox);
	});
}

export function columnFiveFlex(viewport: DOMRect, windows: Array<WindowItem>): void {
	const N = windows.length;
	const cols = 5;
	const rows = Math.ceil(N / cols);
	const windowHeight = Math.floor(viewport.height / rows);

	windows.forEach((item, index) => {
		const isLastRow = index >= N - (N % cols);
		const windowWidth = Math.floor(viewport.width / (isLastRow ? N % cols : cols));
		const x = windowWidth * (index % cols);
		const y = windowHeight * Math.floor(index / cols);

		item.winbox.resize(windowWidth, windowHeight).move(x, y);
		removeWindowControls(item.winbox);
	});
}

function removeWindowControls(winbox: WinBox) {
	winbox
		.addClass("no-min")
		.addClass("no-max")
		.addClass("no-full")
		.addClass("no-resize")
		.addClass("no-move");
}

function addWindowControls(winbox: WinBox) {
	winbox
		.removeClass("no-min")
		.removeClass("no-max")
		.removeClass("no-full")
		.removeClass("no-resize")
		.removeClass("no-move");
}
