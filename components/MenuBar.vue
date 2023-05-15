<script setup lang="ts">
    import { useAppDataStore } from '~~/store/appData';
    const AppDataStore = useAppDataStore()
    const menu = computed(() => AppDataStore.appMenu)
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
                    <MenuDropdown
                        v-if="menuItem.type === 'submenu'"
                        :menu-item="menuItem"
                    />
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
