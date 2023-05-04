<script setup lang="ts">
    import { useWMStore } from '~~/store/wm';
    const WMStore = useWMStore()

    import { IMenuItem } from '~~/store/appData';
    import { useAppDataStore } from '~~/store/appData';
    const AppDataStore = useAppDataStore()
    const menu = computed(() => AppDataStore.appMenu)

    function ClickMenu(menuItem: IMenuItem) {
        WMStore.Open(menuItem.windowTypeId, menuItem.params)
    }

</script>

<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top">
        <div class="container-fluid">
            <a class="vv-navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
            <div class="vv-desktop-menu">
                <div
                    v-for="menuItem in menu"
                    :key="menuItem.name"
                    @mousedown="ClickMenu(menuItem)"
                    class="vv-desktop-menu-item"
                >
                    {{ menuItem.name }}
                </div>
            </div>
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
        margin: 0 0.5rem;
        white-space: nowrap;
        cursor: pointer;
    }
</style>