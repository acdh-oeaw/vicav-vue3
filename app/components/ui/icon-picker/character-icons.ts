/**
 * Single letters and digits are offered as marker icons. They are rendered as
 * `<symbol>` elements by `SVGSymbols.vue`, so they can be referenced by id just
 * like the icons coming from the lucide sprite.
 */
export const CHARACTER_ICON_CATEGORY = "characters";

export interface CharacterIconType {
	name: string;
	character: string;
	categories: Array<string>;
	tags: Array<string>;
}

const LETTERS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const DIGITS = Array.from("0123456789");

function characterIcon(character: string, kind: "digit" | "letter"): CharacterIconType {
	return {
		name: `character-${character.toLowerCase()}`,
		character,
		categories: [CHARACTER_ICON_CATEGORY],
		tags: [kind, character.toLowerCase(), ...(kind === "digit" ? ["number"] : [])],
	};
}

export const characterIcons: Array<CharacterIconType> = [
	...LETTERS.map((letter) => characterIcon(letter, "letter")),
	...DIGITS.map((digit) => characterIcon(digit, "digit")),
];

export function isCharacterIcon(icon?: { character?: string } | null): icon is CharacterIconType {
	return typeof icon?.character === "string";
}
