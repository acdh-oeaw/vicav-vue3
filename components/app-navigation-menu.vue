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
	<Menubar v-model="currentMenu" class="w-full border-none">
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
								emit('select-menu-item', item);
							}
						"
					>
						{{ item.title }}
					</MenubarItem>
					<MenubarSeparator v-else-if="item.type === 'separator'" :key="`separator-${index}`" />
				</template>
			</MenubarContent>
		</MenubarMenu>
		<WindowListDropdown :isMobile="false" />
	</Menubar>
</template>
