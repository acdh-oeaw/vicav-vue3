export function encodeWindowStates(states: Array<unknown>): string {
	return btoa(
		JSON.stringify(states).replace(
			/[\u007f-\uffff]/g,
			(character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
		),
	);
}

export function decodeWindowStates(encoded: string): Array<unknown> {
	const states: unknown = JSON.parse(atob(encoded));
	if (!Array.isArray(states)) throw new Error("Window list parameter must be an array");
	return states;
}
