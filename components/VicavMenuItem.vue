<template>
	<div v-if="menuNode.type==='item'">
		<a
			class="dropdown-item"
			href="#"
			@mousedown="clickMenu(menuNode)"
		>
			{{ menuNode.name }}
		</a>
	</div>
</template>

<script setup lang="ts">
    import { IMenuItem } from "~/store/appData";
    import { useWMStore } from '~~/store/wm';

    const wmStore = useWMStore()

	defineProps<{
        menuNode: IMenuItem;
    }>();

    function clickMenu(menuNode: IMenuItem) {
        if (menuNode.type === 'item') {
            wmStore.open(menuNode.windowTypeId, menuNode.name, menuNode.params)
        }
    }
</script>
