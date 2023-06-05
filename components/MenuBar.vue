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
            <div>Window selector</div>
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
</style>
