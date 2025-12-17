<script setup lang="ts">
import { useDebounce } from "@vueuse/core";
import type { SVGAttributes } from "vue";

import { iconsData } from "./icons-data.ts";

export interface IconType {
	name: string;
	categories?: Array<string>;
	tags?: Array<string>;
	custom?: boolean;
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
		usePopoverPortal?: boolean;
		usePopoverModal?: boolean;
	}>(),
	{ searchable: true, categorized: true, showTooltip: false, usePopoverModal: false },
);

const emit = defineEmits(["update:icon", "update:color"]);

const isOpen = ref(false);
const searchRaw = ref("");
const search = useDebounce(searchRaw, 100);
const selectedIcon = ref<IconType | null>();
// const categories = computed(() => {
// 	return [...new Set(icons.value.flatMap((i) => i.categories))];
// });

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
	isOpen.value = false;
}

const localColor = ref(props.color ?? "#cccccc");
watch(
	() => localColor.value,
	(newColor) => {
		emit("update:color", newColor);
	},
);
</script>

<template>
	<Popover v-model:open="isOpen" :modal="usePopoverModal">
		<PopoverTrigger as-child>
			<Button class="h-auto p-0.5" variant="outline">
				<Icon
					v-if="icon"
					:additional-attributes="icon.additionalAttributes"
					:is-custom-icon="icon.custom"
					:name="icon?.name ?? ''"
					:size="12"
					:style="{ stroke: localColor, fill: icon.custom ? localColor : null }"
				/>
				<span v-else class="px-1">{{ triggerPlaceholder || "Select an icon" }}</span>
			</Button>
		</PopoverTrigger>
		<PopoverContent class="max-w-56 bg-white p-2 text-sm" :use-portal="usePopoverPortal">
			<label class="flex grow-0 basis-0 items-center p-0" @click.capture.stop>
				<span class="mr-2 text-neutral-800">Pick a marker color</span>
				<div
					class="size-4 rounded"
					:style="{
						backgroundColor: localColor,
						stroke: localColor,
					}"
				></div>
				<input v-model="localColor" class="size-0" type="color" @click.capture.stop />
				<span class="sr-only">Select color</span>
			</label>
			<div class="my-2 h-[1px] w-full bg-neutral-200"></div>
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
					<Tooltip v-for="icon in filteredIcons" :key="icon.name">
						<TooltipTrigger @click="selectIcon(icon)">
							<div class="flex items-center justify-center rounded-md border p-2 hover:bg-gray-100">
								<Icon :name="icon.name" />
							</div>
						</TooltipTrigger>
						<TooltipContent class="bg-white">{{ icon.name }}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<Button
					v-for="icon in filteredIcons"
					v-else
					:key="icon.name"
					class="flex aspect-square h-auto items-center justify-center rounded-md border p-1 hover:bg-gray-100"
					variant="outline"
					@click.prevent.stop="selectIcon(icon)"
				>
					<Icon
						:additional-attributes="icon.additionalAttributes"
						:is-custom-icon="icon.custom"
						:name="icon.name"
						:size="16"
						:style="{ stroke: localColor, fill: icon.custom ? localColor : null }"
					/>
				</Button>
			</div>
		</PopoverContent>
	</Popover>
</template>
