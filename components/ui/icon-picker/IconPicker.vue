<script setup lang="ts">
import { useDebounce } from "@vueuse/core";
import type { SVGAttributes } from "vue";

import { iconsData } from "./icons-data";

export interface IconType {
	name: string;
	categories?: Array<string>;
	tags?: Array<string>;
	custom?: boolean;
	additionalAttributes?: SVGAttributes;
}

const props = withDefaults(
	defineProps<{
		modelValue?: IconType;
		searchPlaceholder?: string;
		triggerPlaceholder?: string;
		searchable?: boolean;
		categorized?: boolean;
		limitToCategories?: Array<string>;
		showTooltip?: boolean;
		customIcons?: Array<IconType>;
	}>(),
	{ searchable: true, categorized: true, showTooltip: false },
);

const emit = defineEmits(["update:modelValue"]);

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
	emit("update:modelValue", icon);
	isOpen.value = false;
}
</script>

<template>
	<Popover v-model:open="isOpen">
		<PopoverTrigger as-child>
			<Button class="p-0.5 h-auto" variant="outline">
				<Icon
					v-if="modelValue"
					:additional-attributes="modelValue.additionalAttributes"
					:is-custom-icon="modelValue.custom"
					:name="modelValue?.name ?? ''"
					:size="13"
				/>
				<span v-else class="px-1">{{ triggerPlaceholder || "Select an icon" }}</span>
			</Button>
		</PopoverTrigger>
		<PopoverContent class="w-64 p-2 bg-white">
			<div class="w-full">
				<label
					><input
						v-if="searchable !== false"
						v-model="searchRaw"
						class="mb-2 w-full p-0.5"
						:placeholder="searchPlaceholder || 'Search for an icon...'"
						type="text"
				/></label>
			</div>
			<!--
			<div v-if="props.categorized">
				<Badge v-for="cat in categories" :key="cat" variant="outline">{{ cat }}</Badge>
			</div> -->
			<div class="grid grid-cols-5 gap-2 max-h-60 overflow-auto">
				<TooltipProvider v-if="props.showTooltip">
					<Tooltip v-for="icon in filteredIcons" :key="icon.name">
						<TooltipTrigger @click="selectIcon(icon)">
							<div class="p-2 border rounded-md hover:bg-gray-100 flex items-center justify-center">
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
					class="p-2 border rounded-md hover:bg-gray-100 flex items-center justify-center"
					variant="outline"
					@click.prevent.stop="selectIcon(icon)"
				>
					<Icon
						:additional-attributes="icon.additionalAttributes"
						:is-custom-icon="icon.custom"
						:name="icon.name"
					/>
				</Button>
			</div>
		</PopoverContent>
	</Popover>
</template>
