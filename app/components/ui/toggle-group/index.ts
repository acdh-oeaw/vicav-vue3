import { cva, type VariantProps } from "class-variance-authority";

export { default as ToggleGroup } from "./ToggleGroup.vue";
export { default as ToggleGroupItem } from "./ToggleGroupItem.vue";

export const toggleGroupVariants = cva(
	"inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border border-input bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type ToggleGroupVariants = VariantProps<typeof toggleGroupVariants>;
