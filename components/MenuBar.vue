<script setup lang="ts">
    import { useAppDataStore } from '~~/store/appData';

    const AppDataStore = useAppDataStore()
    const menu = computed(() => AppDataStore.appMenu)

    const isMenuOpen = ref(false)
    function ToggleMenuCollapse(e) {
        isMenuOpen.value = !isMenuOpen.value
    }
</script>

<template>
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
        <div class="container-fluid">
            <a class="vv-navbar-brand mr-0 mr-lg-2" aria-label="Vicav" href="/">
                <img alt="logo" src="~/assets/vicav_logo.svg">
            </a>
            <button
                class="navbar-toggler ms-auto"
                type="button"
                data-toggle="collapse" data-target="#navbarMenu"
                aria-controls="navbarMenu" aria-expanded="false" aria-label="Toggle menu"
                @click="ToggleMenuCollapse"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <button
                class="navbar-toggler vv-window-selector-toggler"
                type="button"
                data-toggle="collapse" data-target="#windowMenu"
                aria-controls="windowMenu" aria-expanded="false" aria-label="Toggle menu"
            >
                <span class="navbar-toggler-icon vv-window-selector-icon" />
            </button>

            <div
                class="navbar-collapse collapse"
                :class="{ show: isMenuOpen }"
                id="navbarMenu"
            >
                <ul class="navbar-nav">
                    <li
                        v-for="(menuNode, index) in menu"
                        :key="index"
                    >
                        <VicavMenuNode
                            :menu-node="menuNode"
                        />
                    </li>
                </ul>
            </div>
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
    .vv-window-selector-toggler {
        display: inline-block !important;
    }
    .vv-window-selector-icon {
        background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'><path stroke='rgba%28255, 255, 255, 0.55%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' fill='none' d='M4,11l11,8l11,-8'/></svg>")
    }
</style>
