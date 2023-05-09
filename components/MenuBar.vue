<script setup lang="ts">
    import { useWMStore } from '~~/store/wm';
    const { $bootstrap } = useNuxtApp()

    const WMStore = useWMStore()

    import { IMenuItem, IMenuNode } from '~~/store/appData';
    import { useAppDataStore } from '~~/store/appData';
    const AppDataStore = useAppDataStore()
    const menu = computed(() => AppDataStore.appMenu)

/*     function ClickMenu(menuItem: IMenuItem) {
        WMStore.Open(menuItem.windowTypeId, menuItem.params)
    }
                    <!-- @mousedown="ClickMenu(menuItem)" -->
 */
</script>

<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top">
        <div class="container-fluid">
            <a class="vv-navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
            <ul class="navbar-nav">
                <li
                    v-for="(menuItem, index) in menu"
                    :key="index"
                    >
                    <MenuItem :menu-item="menuItem"></MenuItem>
                </li>
            </ul>
            <div>Hamburger menu</div>
            <div>Window selector</div>
        </div>
    </nav>
</template>

<style>
    .vv-navbar-brand > img {
        height: 52px;
    }
    .vv-desktop-menu {
        display: flex;
        flex-flow: row nowrap;
    }
    .vv-desktop-menu-item {
        padding: 0 1rem;
        white-space: nowrap;
        cursor: pointer;
    }
</style>
