<script lang="ts" setup>
import { MenuIcon } from "lucide-vue-next";

import type { ItemType, MainItemType } from "@/lib/api-client";

const props = defineProps<{
	menus: Array<MainItemType>;
}>();

const emit = defineEmits<{
	(event: "select-menu-item", item: ItemType): void;
}>();

const { menus } = toRefs(props);

const isSidepanelOpen = ref(false);
const currentMenu = ref("");

function close() {
	isSidepanelOpen.value = false;
	currentMenu.value = "";
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
		<NavigationMenu
			v-model="currentMenu"
			class="w-full max-w-full justify-between border-none"
			orientation="vertical"
		>
			<WindowListDropdown :is-mobile="true" />

			<SheetTrigger aria-label="Toggle menu" class="cursor-default">
				<MenuIcon class="mx-3 my-1.5 size-5" />
			</SheetTrigger>
			<SheetContent class="overflow-y-auto">
				<SheetHeader>
					<SheetTitle class="sr-only">Navigation menu</SheetTitle>
				</SheetHeader>
				<NavigationMenuList class="relative flex-col">
					<NavigationMenuItem v-for="menu of menus" :key="menu.id" class="w-full">
						<NavigationMenuTrigger
							class="w-full bg-transparent hover:bg-accent/50 focus:bg-accent/50 data-[state=open]:hover:bg-accent/50 data-[state=open]:focus:bg-accent/50"
						>
							<!-- <summary class="flex cursor-pointer list-none items-center justify-between font-medium"> -->
							{{ menu.title }}
							<!-- </summary> -->
						</NavigationMenuTrigger>
						<NavigationMenuContent class="min-w-32 bg-background text-on-background">
							<template v-for="(item, index) of menu.item">
								<NavigationMenuLink
									v-if="item.type === 'item'"
									:key="item.id"
									as="div"
									class="cursor-pointer"
									@select="
										() => {
											emit('select-menu-item', item);
											isSidepanelOpen = false;
										}
									"
								>
									{{ item.title }}
								</NavigationMenuLink>
								<NavigationMenuSeparator
									v-else-if="item.type === 'separator'"
									:key="`separator-${index}`"
								/>
							</template>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuViewport />
				</NavigationMenuList>
			</SheetContent>
		</NavigationMenu>
	</Sheet>
</template>
