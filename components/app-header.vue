<script lang="ts" setup>
import { isNonEmptyString } from "@acdh-oeaw/lib";

import type { ItemType } from "@/lib/api-client/Api";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const { data, suspense } = useProjectInfo();
await suspense();

const menus = computed(() => {
	return data.value?.projectConfig?.menu?.main ?? [];
});

const logo = computed(() => {
	const url = data.value?.projectConfig?.logo?.img;

	// TODO: default should be set via zod schema
	return url ?? "/assets/images/logo.svg";
});

function createWindowTitle(item: ItemType) {
	if (isNonEmptyString(item.label)) return item.label;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return item.title!;
}

function onSelectMenuItem(item: ItemType) {
	switch (item.componentName) {
		case "BiblioQuery": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "bibliography-query",
				params: {},
			});
			break;
		}

		case "CorpusQuery": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "corpus-query",
				params: {},
			});
			break;
		}

		case "CrossDictQuery": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "cross-dictionary-query",
				params: {},
			});
			break;
		}

		case "DataList": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "data-list",
				params: {},
			});
			break;
		}

		case "DictQuery": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "dictionary-query",
				params: {},
			});
			break;
		}

		case "SampleText": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "sample-text",
				params: {},
			});
			break;
		}

		case "Text": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "text",
				params: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					id: item.id!,
				},
			});
			break;
		}

		case "WMap": {
			addWindow({
				id: item.target,
				title: createWindowTitle(item),
				kind: "geo-map",
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				params: item.query!,
			});
			break;
		}

		default:
	}
}
</script>

<template>
	<header class="border-b border-border bg-surface text-on-surface">
		<div class="flex items-center justify-between gap-4 px-8 py-4">
			<!-- TODO: do we really need this logo/link -->
			<NuxtLink class="flex shrink-0" href="/">
				<span class="sr-only">Home</span>
				<img alt="" class="h-10 hue-rotate-180 invert" :src="logo" />
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
