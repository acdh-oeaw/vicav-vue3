<script lang="ts" setup>
import type { ItemType, MainItemType } from "@/lib/api-client";

const props = defineProps<{
	menus: Array<MainItemType>;
}>();

const emit = defineEmits<{
	(event: "select-menu-item", item: ItemType): void;
}>();

const { menus } = toRefs(props);

const currentMenu = ref("");

function close() {
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
	<NavigationMenu v-model="currentMenu" class="w-full max-w-full justify-between border-none">
		<NavigationMenuList>
			<NavigationMenuItem v-for="menu of menus" :key="menu.id">
				<NavigationMenuTrigger
					class="bg-transparent hover:bg-accent/50 focus:bg-accent/50 data-[state=open]:hover:bg-accent/50 data-[state=open]:focus:bg-accent/50"
				>
					{{ menu.title }}
				</NavigationMenuTrigger>
				<NavigationMenuContent class="min-w-48 bg-background text-on-background">
					<template v-for="(item, index) of menu.item">
						<NavigationMenuLink
							v-if="item.type === 'item'"
							:key="item.id"
							as="div"
							class="cursor-pointer"
							@select="
								() => {
									emit('select-menu-item', item);
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
		</NavigationMenuList>
	</NavigationMenu>

	<WindowListDropdown :is-mobile="false" />
</template>
