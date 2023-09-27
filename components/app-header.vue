<script lang="ts" setup>
import { createUrl, isNonEmptyString } from "@acdh-oeaw/lib";
import { AppWindowIcon, CheckIcon, ChevronRightIcon, MenuIcon } from "lucide-vue-next";

import type { ItemType } from "@/lib/api-client/Api";

const env = useRuntimeConfig();

const windowsStore = useWindowsStore();
const { addWindow, setWindowArrangement } = windowsStore;
const { arrangement: currentArrangement, registry } = storeToRefs(windowsStore);

const { data, suspense } = useProjectInfo();
await suspense();

const menus = computed(() => {
	return data.value?.projectConfig?.menu?.main ?? [];
});

const logo = computed(() => {
	const url = data.value?.projectConfig?.logo?.img;

	// TODO: defaul should be set via zod schema
	if (url == null) return "/assets/images/logo.svg";

	// FIXME: api should return fully qualified url
	return String(
		createUrl({
			baseUrl: env.public.NUXT_PUBLIC_API_BASE_URL,
			pathname: `/vicav/${url}`,
		}),
	);
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
				id: item.id,
				title: createWindowTitle(item),
				kind: "bibliography-query",
				params: {},
			});
			break;
		}

		case "CorpusQuery": {
			addWindow({
				id: item.id,
				title: createWindowTitle(item),
				kind: "corpus-query",
				params: {},
			});
			break;
		}

		case "CrossDictQuery": {
			addWindow({
				id: item.id,
				title: createWindowTitle(item),
				kind: "cross-dictionary-query",
				params: {},
			});
			break;
		}

		case "DataList": {
			addWindow({
				id: item.id,
				title: createWindowTitle(item),
				kind: "data-list",
				params: {},
			});
			break;
		}

		case "DictQuery": {
			addWindow({
				id: item.id,
				title: createWindowTitle(item),
				kind: "dictionary-query",
				params: {},
			});
			break;
		}

		case "SampleText": {
			addWindow({
				id: item.id,
				title: createWindowTitle(item),
				kind: "sample-text",
				params: {},
			});
			break;
		}

		case "Text": {
			addWindow({
				id: item.id,
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
				id: item.id,
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

const isSidepanelOpen = ref(false);
</script>

<template>
	<header class="border-b border-border bg-surface text-on-surface">
		<div class="flex items-center justify-between gap-4 px-8 py-4">
			<!-- TODO: do we really need this logo/link -->
			<NuxtLink class="flex shrink-0" href="/">
				<span class="sr-only">Home</span>
				<img alt="" class="h-10 hue-rotate-180 invert" :src="logo" />
			</NuxtLink>

			<Menubar class="hidden flex-1 border-none lg:flex">
				<MenubarMenu v-for="menu of menus" :key="menu.id">
					<MenubarTrigger>
						{{ menu.title }}
					</MenubarTrigger>
					<MenubarContent>
						<template v-for="(item, index) of menu.item">
							<MenubarItem
								v-if="item.type === 'item'"
								:key="item.id"
								@select="
									() => {
										onSelectMenuItem(item);
									}
								"
							>
								{{ item.title }}
							</MenubarItem>
							<MenubarSeparator v-else-if="item.type === 'separator'" :key="`separator-${index}`" />
						</template>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger aria-label="Windows" class="ml-auto">
						<AppWindowIcon class="h-6 w-6" />
					</MenubarTrigger>
					<MenubarContent align="end">
						<template v-if="registry.size === 0">
							<MenubarLabel>No windows open</MenubarLabel>
						</template>
						<template v-else>
							<MenubarLabel>Windows ({{ registry.size }})</MenubarLabel>
							<MenubarSeparator />
							<MenubarItem
								v-for="[id, item] of registry"
								:key="id"
								@select="
									() => {
										// @ts-expect-error Property missing in upstream types.
										if (item.winbox.min) {
											// @ts-expect-error Method missing in upstream types.
											item.winbox.restore();
										}

										item.winbox.focus();
									}
								"
							>
								{{ item.winbox.title }}
							</MenubarItem>
							<MenubarSeparator />
							<MenubarLabel>Arrangement</MenubarLabel>
							<MenubarSeparator />
							<MenubarItem
								v-for="(arrangement, id) of arrangements"
								:key="id"
								class="justify-between"
								@select="
									() => {
										setWindowArrangement(id);
									}
								"
							>
								{{ arrangement.label }}
								<CheckIcon v-if="id === currentArrangement" class="h-4 w-4" />
							</MenubarItem>
						</template>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>

			<div class="flex shrink-0 lg:hidden">
				<Sheet v-model:open="isSidepanelOpen">
					<SheetTrigger aria-label="Toggle menu" class="cursor-default">
						<MenuIcon class="h-5 w-5" />
					</SheetTrigger>
					<SheetContent class="overflow-y-auto">
						<div class="grid divide-y divide-border py-8">
							<details
								v-for="menu of menus"
								:key="menu.id"
								class="group py-4"
								name="menu-accordion"
							>
								<summary
									class="flex cursor-pointer list-none items-center justify-between font-medium"
								>
									{{ menu.title }}
									<ChevronRightIcon class="h-4 w-4 transition group-open:rotate-90" />
								</summary>
								<ul class="mt-2 grid gap-1" role="list">
									<template v-for="(item, index) of menu.item">
										<li v-if="item.type === 'item'" :key="item.id">
											<button
												class="cursor-default py-1 text-on-background/75 transition hover:text-on-background"
												@click="
													() => {
														onSelectMenuItem(item);
														isSidepanelOpen = false;
													}
												"
											>
												{{ item.title }}
											</button>
										</li>
										<li
											v-else-if="item.type === 'separator'"
											:key="`separator-${index}`"
											role="separator"
											class="-mx-1 my-1 h-px bg-muted"
										/>
									</template>
								</ul>
							</details>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	</header>
</template>
