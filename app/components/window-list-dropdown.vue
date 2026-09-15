<script setup lang="ts">
import { AppWindowIcon, CheckIcon, X } from "@lucide/vue";

const props = defineProps<{
	isMobile: boolean;
}>();

const router = useRouter();
const route = useRoute();

const windowsStore = useWindowsStore();
const { setWindowArrangement, removeWindow } = windowsStore;
const { arrangement: currentArrangement, registry } = storeToRefs(windowsStore);
</script>

<template>
	<Menubar class="border-none">
		<MenubarMenu>
			<MenubarTrigger aria-label="Windows" class="ml-auto">
				<AppWindowIcon class="size-6" />
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
						class="justify-between gap-2 items-center"
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
						<Button class="p-1 size-fit" variant="ghost" @click="removeWindow(id)"
							><X class="size-3"></X><span class="sr-only">Close window</span></Button
						>
					</MenubarItem>
				</template>
				<template v-if="!props.isMobile">
					<!-- <MenubarSeparator /> -->
					<MenubarLabel class="mt-4">Arrangement</MenubarLabel>
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
						<CheckIcon v-if="id === currentArrangement" class="size-4" />
					</MenubarItem>
				</template>
			</MenubarContent>
		</MenubarMenu>
	</Menubar>
</template>
