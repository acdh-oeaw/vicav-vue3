<script lang="ts" setup>
import { ChevronRightIcon, MenuIcon } from "lucide-vue-next";

import type { ItemType, MainItemType } from "@/lib/api-client";

const props = defineProps<{
	menus: Array<MainItemType>;
}>();

const emit = defineEmits<{
	(event: "select-menu-item", item: ItemType): void;
}>();

const { menus } = toRefs(props);

const isSidepanelOpen = ref(false);

function close() {
	isSidepanelOpen.value = false;
}

onMounted(() => {
	window.addEventListener("resize", close, { passive: true });
});

onScopeDispose(() => {
	window.removeEventListener("resize", close);
});
</script>

<template>
	<Sheet v-model:open="isSidepanelOpen">
		<Menubar class="w-full border-none">
			<WindowListDropdown :is-mobile="true" />
		</Menubar>
		<SheetTrigger aria-label="Toggle menu" class="cursor-default">
			<MenuIcon class="mx-3 my-1.5 size-5" />
		</SheetTrigger>
		<SheetContent class="overflow-y-auto">
			<SheetTitle class="sr-only">Navigation menu</SheetTitle>
			<div class="grid divide-y divide-border py-8">
				<details v-for="menu of menus" :key="menu.id" class="group py-4" name="menu-accordion">
					<summary class="flex cursor-pointer list-none items-center justify-between font-medium">
						{{ menu.title }}
						<ChevronRightIcon class="size-4 transition group-open:rotate-90" />
					</summary>
					<ul class="mt-2 grid gap-1" role="list">
						<template v-for="(item, index) of menu.item">
							<li v-if="item.type === 'item'" :key="item.id">
								<button
									class="cursor-default py-1 text-on-background/75 transition hover:text-on-background"
									@click="
										() => {
											emit('select-menu-item', item);
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
								class="-mx-1 my-1 h-px bg-muted"
								role="separator"
							/>
						</template>
					</ul>
				</details>
			</div>
		</SheetContent>
	</Sheet>
</template>
