<script lang="ts" setup>
import { isNonEmptyString } from "@acdh-oeaw/lib";

import type { ItemType } from "@/lib/api-client";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const { data, suspense } = useProjectInfo();
await suspense();

const menus = computed(() => {
	return data.value?.projectConfig?.menu?.main ?? [];
});

const logo = computed(() => {
	return data.value?.projectConfig?.logo?.img;
});

const titlestring = computed(() => {
	return data.value?.projectConfig?.logo?.string;
});

function createWindowTitle(item: ItemType) {
	if (isNonEmptyString(item.label)) return item.label;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return item.title!;
}

function onSelectMenuItem(item: ItemType) {
	addWindow({
		kind: item.targetType,
		params:
			item.targetType === "BiblioEntries" && typeof item.queryString === "undefined"
				? { queryString: "" }
				: item, // TODO: standardize parameters and replace this simply with "item"
		title: createWindowTitle(item),
	} as WindowState);
}
</script>

<template>
	<header class="border-b border-border bg-header text-on-header">
		<div class="flex items-center justify-between gap-4 px-8 py-4">
			<NuxtLink class="flex shrink-0" href="/">
				<span v-if="titlestring" class="titlestring">{{ titlestring }}</span>
				<img v-if="logo" alt="" class="h-10" :src="logo" />
			</NuxtLink>

			<div class="hidden flex-1 lg:flex">
				<AppNavigationMenu
					v-if="menus.length > 0"
					:menus="menus"
					@select-menu-item="onSelectMenuItem"
				/>
			</div>

			<div class="flex shrink-0 lg:hidden">
				<AppNavigationMobileMenu
					v-if="menus.length > 0"
					:menus="menus"
					@select-menu-item="onSelectMenuItem"
				/>
			</div>
		</div>
	</header>
</template>

<style>
.titlestring {
	margin-top: -10px;
	font-weight: 700;
	font-style: italic;
	font-size: 2.5em;
	font-family: Times, serif;
	line-height: 1;
}
</style>
