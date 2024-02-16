import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default: "text-primary-foreground border-transparent bg-primary hover:bg-primary/80",
				secondary:
					"text-secondary-foreground border-transparent bg-secondary hover:bg-secondary/80",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
				outline: "text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
