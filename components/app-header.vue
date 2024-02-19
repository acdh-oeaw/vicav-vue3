<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";

import type { ItemType } from "@/lib/api-client";
import type {
	BibliographyEntriesWindowItem,
	FeatureWindowItem,
	GeoMapWindowItem,
	ListMapWindowItem,
	ProfileWindowItem,
	SampleTextWindowItem,
	TextWindowItem,
} from "@/types/global.d";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const { data, suspense } = useProjectInfo();
onServerPrefetch(async () => {
	/**
	 * @see https://github.com/TanStack/query/issues/6606
	 * @see https://github.com/TanStack/query/issues/5976
	 */
	await suspense().catch(noop);
});

const menus = computed(() => {
	return data.value?.projectConfig?.menu?.main ?? [];
});

const logo = computed(() => {
	return data.value?.projectConfig?.logo?.img;
});

const titlestring = computed(() => {
	return data.value?.projectConfig?.logo?.string;
});

function onSelectMenuItem(item: ItemType) {
	let newWindowState: WindowState;
	// TODO: move zod-based typing to the api definition, so this switch can be deleted
	switch (item.targetType) {
		case "BiblioEntries":
			newWindowState = {
				targetType: "BiblioEntries",
				params: item.params as BibliographyEntriesWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "Feature":
			newWindowState = {
				targetType: "Feature",
				params: item.params as FeatureWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "WMap":
			newWindowState = {
				targetType: "WMap",
				params: item.params as GeoMapWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "Profile":
			newWindowState = {
				targetType: "Profile",
				params: item.params as ProfileWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "SampleText":
			newWindowState = {
				targetType: "SampleText",
				params: item.params as SampleTextWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "Text":
			newWindowState = {
				targetType: "Text",
				params: item.params as TextWindowItem["params"],
				title: item.label ?? "",
			};
			break;
		case "ListMap":
			newWindowState = {
				targetType: "ListMap",
				title: item.label ?? "",
				params: item.params as ListMapWindowItem["params"],
			};
			break;
		default:
			throw new Error(`Window targetType not implemented on front-end: ${item.targetType}`);
	}
	addWindow(newWindowState);
}
</script>

<template>
	<header class="border-b border-border bg-header text-on-header">
		<div class="flex items-center justify-between gap-4 px-8 py-4">
			<NuxtLink class="flex shrink-0" href="/">
				<!-- eslint-disable-next-line tailwindcss/no-custom-classname -->
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
