<script setup lang="ts">
	import { useAppDataStore } from '~~/store/appData'
    const AppDataStore = useAppDataStore()
    const title = computed(() => AppDataStore.appTitle)
    watch(title, (title) => { document.title = title })
</script>

<template>
    <client-only>
        <MenuBar/>
        <WindowManager/>
    </client-only>
</template>
