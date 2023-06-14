<template>
    <!-- TODO: refactor this hub to a dynamic <component> tag -->
    <VicavMenuSubmenu
        v-if="props.menuNode.type==='submenu'"
        :menu-node="props.menuNode"
    />
    <VicavMenuItem
        v-if="props.menuNode.type==='item'"
        :menu-node="props.menuNode"
        @itemclick="ItemClick"
    />
    <VicavMenuSeparator
        v-if="props.menuNode.type==='separator'"
    />
</template>

<script setup lang="ts">
	import { defineEmits } from "vue";
    import { IMenuNode } from "~/store/appData";

	const emit = defineEmits(['itemclick'])
    const props = defineProps<{
        menuNode: IMenuNode;
    }>();

    function ItemClick() {
        console.log('MenuNode received click event')
        emit('itemclick')
    }
</script>
