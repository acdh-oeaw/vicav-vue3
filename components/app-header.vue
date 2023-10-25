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
	const url = data.value?.projectConfig?.logo?.img;

	// TODO: default should be set via zod schema
	return url ?? "/assets/images/logo.svg";
});

function createWindowId(_item: ItemType) {
	/**
	 * We intentionally do *not* use `item.target` for window id, because we don't want to
	 * deduplicate windows. It should be possible to open multiple instances of the same
	 * window, so we rely on the store to assign a unique id.
	 */
	return null;
}

function createWindowTitle(item: ItemType) {
	if (isNonEmptyString(item.label)) return item.label;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return item.title!;
}

function onSelectMenuItem(item: ItemType) {
	switch (item.componentName) {
		case "BiblioQuery": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "bibliography-query",
				params: {},
			});
			break;
		}

		case "CorpusQuery": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "corpus-query",
				params: {},
			});
			break;
		}

		case "CorpusText": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "corpus-text",
				params: {},
			});
			break;
		}

		case "CrossDictQuery": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "cross-dictionary-query",
				params: {},
			});
			break;
		}

		case "DataList": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "data-list",
				params: {},
			});
			break;
		}

		case "DictQuery": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "dictionary-query",
				params: {},
			});
			break;
		}

		case "SampleText": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "sample-text",
				params: {},
			});
			break;
		}

		case "Text": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "text",
				params: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					id: item.target!,
				},
			});
			break;
		}

		case "WMap": {
			addWindow({
				id: createWindowId(item),
				title: createWindowTitle(item),
				kind: "geo-map",
				params: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					...item.query!,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					id: item.target!,
				},
			});
			break;
		}

		default:
	}
}
</script>

<template>
	<header class="border-b border-border bg-header text-on-header">
		<div class="flex items-center justify-between gap-4 px-8 py-4">
			<NuxtLink class="flex shrink-0" href="/">
				<span class="sr-only">Home</span>
				<img alt="" class="h-10" :src="logo" />
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
