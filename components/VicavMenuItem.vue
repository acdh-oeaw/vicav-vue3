<template>
	<div v-if="menuNode.type==='item'">
		<a
			class="dropdown-item"
			href="#"
			@mousedown="ClickMenu(menuNode)"
		>
			{{ menuNode.name }}
		</a>
	</div>
</template>

<script setup lang="ts">
    import { useAppDataStore } from '~~/store/appData';
    import { IMenuItem } from "~/store/appData";
    import { useWMStore } from '~~/store/wm';

    const AppDataStore = useAppDataStore()
    const WMStore = useWMStore()

	const props = defineProps<{
        menuNode: IMenuItem;
    }>();

    function ClickMenu(menuNode: IMenuItem) {
        if (menuNode.type === 'item') {
            WMStore.Open(menuNode.windowTypeId, menuNode.params)
        }
    }
</script>
