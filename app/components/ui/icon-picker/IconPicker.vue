<script setup lang="ts">
import { Dices, Eye, EyeOff, PencilIcon, SwatchBook } from "@lucide/vue";
import { useDebounce } from "@vueuse/core";
import type { SVGAttributes } from "vue";

import { iconsData } from "./icons-data.ts";

export interface IconType {
	name: string;
	categories?: Array<string>;
	tags?: Array<string>;
	custom?: boolean;
	/** Set on icons that draw a single letter or digit, see `character-icons.ts`. */
	character?: string;
	additionalAttributes?: SVGAttributes;
}

const props = withDefaults(
	defineProps<{
		icon?: IconType;
		searchPlaceholder?: string;
		triggerPlaceholder?: string;
		searchable?: boolean;
		categorized?: boolean;
		limitToCategories?: Array<string>;
		showTooltip?: boolean;
		customIcons?: Array<IconType>;
		color?: string;
		hidden?: boolean;
		enableHideToggle?: boolean;
		enableApplyToUnderlyingFeatureValues?: boolean;
		usePopoverPortal?: boolean;
		usePopoverModal?: boolean;
		displayEditIcon?: boolean;
	}>(),
	{
		searchable: true,
		categorized: true,
		showTooltip: false,
		enableHideToggle: false,
		usePopoverModal: false,
	},
);

const emit = defineEmits([
	"update:icon",
	"update:color",
	"update:hidden",
	"apply-style-to-underlying",
	"generate-color-variants",
	"randomize-colors",
	"randomize-icons",
]);

const isOpen = ref(false);
const searchRaw = ref("");
const search = useDebounce(searchRaw, 100);
const selectedIcon = ref<IconType | null>();

const icons = ref<Array<IconType>>(iconsData);

function matchString(arr: Array<string>, searchValue: string) {
	return arr.find((entry) => entry.toLowerCase().includes(searchValue.toLowerCase()));
}

const filteredIcons = computed(() => {
	//@ts-expect-error potentially recursive type due to SVGAttributes
	let filterResult: Array<IconType> = [
		...icons.value,
		...(props.customIcons ? props.customIcons.map((icon) => ({ ...icon, custom: true })) : []),
	];
	if (props.limitToCategories)
		filterResult = filterResult.filter((res) =>
			res.categories?.some((cat) => props.limitToCategories?.includes(cat)),
		);
	if (!search.value.trim()) return filterResult;
	return filterResult.filter(
		(entry) =>
			matchString(entry.categories ?? [], search.value) ||
			matchString([entry.name], search.value) ||
			matchString(entry.tags ?? [], search.value),
	);
});

function selectIcon(icon: IconType) {
	selectedIcon.value = icon;
	emit("update:icon", icon);
	if (!props.enableApplyToUnderlyingFeatureValues) isOpen.value = false;
}

const localColor = ref(props.color ?? "#cccccc");
const currentIcon = computed(() => selectedIcon.value ?? props.icon ?? null);

watch(
	() => props.color,
	(newColor) => {
		if (newColor) localColor.value = newColor;
	},
);

watch(
	() => localColor.value,
	(newColor) => {
		emit("update:color", newColor);
	},
);

function updateHidden(hidden: boolean) {
	emit("update:hidden", hidden);
}

function applyToUnderlyingFeatureValues() {
	emit("apply-style-to-underlying", {
		icon: currentIcon.value,
	});
}

function generateColorVariants() {
	emit("generate-color-variants");
}

const actionButtonClass = "flex h-7 items-center justify-start gap-1.5 px-2 text-xs font-normal";

function randomizeColors() {
	emit("randomize-colors");
}

function randomizeIcons() {
	emit("randomize-icons");
}
</script>

<template>
	<Popover v-model:open="isOpen" :modal="usePopoverModal">
		<PopoverTrigger as-child>
			<Button class="h-auto p-0.5" variant="outline">
				<Icon
					v-if="icon && !displayEditIcon"
					:additional-attributes="icon.additionalAttributes"
					:is-custom-icon="icon.custom"
					:name="icon?.name ?? ''"
					:size="12"
					:style="{ stroke: localColor, fill: icon.custom ? localColor : null }"
				/>
				<PencilIcon v-else-if="displayEditIcon" :size="12"></PencilIcon>
				<span v-else class="px-1">{{ triggerPlaceholder || "Select an icon" }}</span>
			</Button>
		</PopoverTrigger>
		<PopoverContent class="max-w-58 bg-white p-2 text-sm" :use-portal="usePopoverPortal">
			<div :aria-disabled="hidden" :class="hidden ? 'opacity-45 pointer-events-none' : ''">
				<label class="flex grow-0 basis-0 items-center p-0" @click.capture.stop>
					<span class="mr-2 text-neutral-800">Pick a marker color</span>
					<div
						class="size-4 rounded-sm"
						:style="{
							backgroundColor: localColor,
							stroke: localColor,
						}"
					></div>
					<input v-model="localColor" class="size-0" type="color" @click.capture.stop />
					<span class="sr-only">Select color</span>
				</label>

				<div class="my-2 h-px w-full bg-neutral-200"></div>

				<div class="mt-0.5 w-full">
					<label
						><input
							v-if="searchable !== false"
							v-model="searchRaw"
							class="mb-2 w-full p-0.5"
							:placeholder="searchPlaceholder || 'Search for an icon...'"
							type="text"
					/></label>
				</div>
				<div class="grid max-h-60 grid-cols-5 gap-2 overflow-auto">
					<TooltipProvider v-if="props.showTooltip">
						<Tooltip v-for="iconOption in filteredIcons" :key="iconOption.name">
							<TooltipTrigger @click="selectIcon(iconOption)">
								<div
									class="flex items-center justify-center rounded-md border p-2 hover:bg-gray-100"
								>
									<Icon :name="iconOption.name" />
								</div>
							</TooltipTrigger>
							<TooltipContent class="bg-white">{{ iconOption.name }}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<Button
						v-for="iconOption in filteredIcons"
						v-else
						:key="iconOption.name"
						class="flex aspect-square h-auto items-center justify-center rounded-md border p-1 hover:bg-gray-100"
						:class="{
							'border-2 bg-gray-100':
								currentIcon?.name === iconOption.name && currentIcon?.custom === iconOption.custom,
						}"
						variant="outline"
						@click.prevent.stop="selectIcon(iconOption)"
					>
						<Icon
							:additional-attributes="iconOption.additionalAttributes"
							:is-custom-icon="iconOption.custom"
							:name="iconOption.name"
							:size="16"
							:style="{ stroke: localColor, fill: iconOption.custom ? localColor : null }"
						/>
					</Button>
				</div>
			</div>
			<div
				v-if="enableApplyToUnderlyingFeatureValues"
				:aria-disabled="hidden"
				class="mt-2 border-t border-neutral-200 pt-2"
				:class="hidden ? 'pointer-events-none opacity-45' : ''"
			>
				<div class="mb-1.5 text-xs font-medium text-neutral-500">Underlying feature values</div>
				<div class="grid grid-cols-[auto_1fr_1fr] items-center gap-1 text-xs">
					<span class="pr-1 text-neutral-600">Icon</span>
					<Button
						:class="actionButtonClass"
						:disabled="hidden"
						title="Apply this icon to all underlying feature values"
						variant="outline"
						@click.prevent.stop="applyToUnderlyingFeatureValues()"
					>
						<Icon
							v-if="currentIcon"
							:additional-attributes="currentIcon.additionalAttributes"
							class="size-3 shrink-0"
							:is-custom-icon="currentIcon.custom"
							:name="currentIcon.name"
							:style="{ stroke: 'currentColor', fill: currentIcon.custom ? 'currentColor' : null }"
						/>
						<span>Apply</span>
					</Button>
					<Button
						:class="actionButtonClass"
						:disabled="hidden"
						title="Give each feature value a different random shape"
						variant="outline"
						@click.prevent.stop="randomizeIcons()"
					>
						<Dices class="size-3 shrink-0" />
						<span>Randomize</span>
					</Button>

					<span class="pr-1 text-neutral-600">Color</span>
					<Button
						:class="actionButtonClass"
						:disabled="hidden"
						title="Generate lighter and darker variants of this color for all feature values"
						variant="outline"
						@click.prevent.stop="generateColorVariants()"
					>
						<SwatchBook class="size-3 shrink-0" />
						<span>Variants</span>
					</Button>
					<Button
						:class="actionButtonClass"
						:disabled="hidden"
						title="Give each feature value a different random color"
						variant="outline"
						@click.prevent.stop="randomizeColors()"
					>
						<Dices class="size-3 shrink-0" />
						<span>Randomize</span>
					</Button>
				</div>
			</div>
			<button
				v-if="enableHideToggle"
				class="mt-2 flex w-full items-center gap-2 rounded-md border-t border-neutral-200 px-1 pt-2 text-xs text-neutral-600 hover:text-neutral-900"
				type="button"
				@click.prevent.stop="updateHidden(!(hidden ?? false))"
			>
				<Eye v-if="hidden" class="size-3.5 shrink-0" />
				<EyeOff v-else class="size-3.5 shrink-0" />
				<span>{{ hidden ? "Show in markers" : "Hide from markers" }}</span>
			</button>
		</PopoverContent>
	</Popover>
</template>
