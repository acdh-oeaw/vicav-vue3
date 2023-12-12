<script setup lang="ts">
import { AppWindowIcon, CheckIcon } from "lucide-vue-next";

const props = defineProps<{
	isMobile: boolean;
}>();

const router = useRouter();
const route = useRoute();

const windowsStore = useWindowsStore();
const { setWindowArrangement } = windowsStore;
const { arrangement: currentArrangement, registry } = storeToRefs(windowsStore);
</script>

<template>
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

							/** Windows are only displayed on `/`. */
							if (route.path !== '/') {
								void router.push('/');
							}
						}
					"
				>
					{{ item.winbox.title }}
				</MenubarItem>
			</template>
			<template v-if="!props.isMobile">
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
</template>
