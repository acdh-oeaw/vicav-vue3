<script lang="ts" setup>
import { AppWindowIcon, CheckIcon } from "lucide-vue-next";

import type { ItemType, MainItemType } from "@/lib/api-client";

const props = defineProps<{
	menus: Array<MainItemType>;
}>();

const emit = defineEmits<{
	(event: "select-menu-item", item: ItemType): void;
}>();

const { menus } = toRefs(props);

const windowsStore = useWindowsStore();
const { setWindowArrangement } = windowsStore;
const { arrangement: currentArrangement, registry } = storeToRefs(windowsStore);

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
</template>
