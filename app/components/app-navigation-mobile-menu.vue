<script lang="ts" setup>
import { MenuIcon } from "@lucide/vue";

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

function selectItem(item: ItemType) {
	emit("select-menu-item", item);
	close();
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
		<div class="flex w-full items-center justify-between">
			<WindowListDropdown :is-mobile="true" />
			<SheetTrigger aria-label="Toggle navigation" class="cursor-default">
				<MenuIcon class="mx-3 my-1.5 size-5" />
			</SheetTrigger>
		</div>
		<SheetContent class="overflow-y-auto">
			<SheetHeader>
				<SheetTitle class="sr-only">Navigation menu</SheetTitle>
				<SheetDescription class="sr-only">Site navigation</SheetDescription>
			</SheetHeader>
			<nav aria-label="Main navigation">
				<Accordion class="w-full" collapsible type="single">
					<AccordionItem v-for="menu of menus" :key="menu.id" :value="menu.id">
						<AccordionTrigger>{{ menu.title }}</AccordionTrigger>
						<AccordionContent>
							<template v-for="(item, index) of menu.item" :key="item.id ?? `sep-${index}`">
								<button
									v-if="item.type === 'item'"
									class="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-on-accent focus-visible:ring-2 focus-visible:outline-none"
									type="button"
									@click="selectItem(item)"
								>
									{{ item.title }}
								</button>
								<div v-else-if="item.type === 'separator'" class="my-1 w-full border-b" />
							</template>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</nav>
		</SheetContent>
	</Sheet>
</template>
