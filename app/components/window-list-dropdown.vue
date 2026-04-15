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
	<NavigationMenuList>
		<NavigationMenuItem>
			<NavigationMenuTrigger
				aria-label="Windows"
				class="bg-transparent hover:bg-accent/50 focus:bg-accent/50 data-[state=open]:hover:bg-accent/50 data-[state=open]:focus:bg-accent/50"
			>
				<AppWindowIcon class="size-6" />
			</NavigationMenuTrigger>
			<NavigationMenuContent align="end" class="min-w-52 bg-background text-on-background">
				<template v-if="registry.size === 0">
					<NavigationMenuLabel>No windows open</NavigationMenuLabel>
				</template>
				<template v-else>
					<NavigationMenuLabel>Windows ({{ registry.size }})</NavigationMenuLabel>
					<NavigationMenuSeparator />
					<NavigationMenuLink
						v-for="[id, item] of registry"
						:key="id"
						as="div"
						class="text-left"
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
					</NavigationMenuLink>
				</template>
				<template v-if="!props.isMobile">
					<NavigationMenuLabel class="mt-4">Arrangement</NavigationMenuLabel>
					<NavigationMenuSeparator />
					<NavigationMenuLink
						v-for="(arrangement, id) of arrangements"
						:key="id"
						as="div"
						class="flex-row justify-between"
						@select="
							() => {
								setWindowArrangement(id);
							}
						"
					>
						{{ arrangement.label }}
						<CheckIcon v-if="id === currentArrangement" class="size-4" />
					</NavigationMenuLink>
				</template>
			</NavigationMenuContent>
		</NavigationMenuItem>
	</NavigationMenuList>
</template>
