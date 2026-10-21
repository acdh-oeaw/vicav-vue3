export const SHAPE_ICON_CATEGORY = "shapes";

export interface ShapeIconType {
	name: string;
	categories: Array<string>;
	tags?: Array<string>;
	additionalAttributes?: Record<string, string>;
	/** Shapes are drawn from the custom sprite, not looked up among the lucide icons of the same name. */
	custom: true;
}

export const shapeIcons: Array<ShapeIconType> = [
	{
		name: "petal",
		custom: true,
		categories: [SHAPE_ICON_CATEGORY],
		tags: [],
		additionalAttributes: {
			"stroke-width": "40",
			height: "90%",
			y: "5%",
		},
	},
	...[
		"circle-small",
		"badge",
		"club",
		"cross",
		"diamond",
		"heart",
		"hexagon",
		"octagon",
		"pentagon",
		"rectangle-horizontal",
		"rectangle-vertical",
		"shield",
		"sparkle",
		"square",
		"squircle",
		"star",
		"triangle",
	].map((iconName) => ({
		name: iconName,
		custom: true as const,
		categories: [SHAPE_ICON_CATEGORY],
	})),
];
