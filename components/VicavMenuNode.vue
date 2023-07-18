<template>
    <!-- TODO: refactor this hub to a dynamic <component> tag -->
    <VicavMenuSubmenu
        v-if="props.menuNode.type==='submenu'"
        :menu-node="props.menuNode"
    />
    <VicavMenuItem
        v-if="props.menuNode.type==='item'"
        :menu-node="props.menuNode"
    />
    <VicavMenuSeparator
        v-if="props.menuNode.type==='separator'"
    />
</template>

<script setup lang="ts">
    import { IMenuNode } from "~/store/appData";

    const props = defineProps<{
        menuNode: IMenuNode;
    }>();
</script>
