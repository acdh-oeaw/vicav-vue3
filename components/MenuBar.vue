<script setup lang="ts">
    import { Dropdown } from "bootstrap";
    import { useAppDataStore } from '~~/store/appData';
    import { useWMStore } from '~~/store/wm';

    const AppDataStore = useAppDataStore()
    const menu = computed(() => AppDataStore.appMenu)

    const isMenuOpen = ref(false)
    function ToggleMenuCollapse(e) {
        isWindowListOpen.value = false
        isMenuOpen.value = !isMenuOpen.value
    }

    const WMStore = useWMStore()
    const windowList = computed(() => {
        // TODO: populate array
        return [{ id: null, name: 'No windows open'}]
    })
    function SelectWindow(window) {
        if (window.id != null) {
            // TODO: focus window
        }
    }

    const isWindowListOpen = ref(false)
    const { $bootstrap } = useNuxtApp()
    let windowListDropdown: Dropdown;
    const windowListTogglerRef = ref<HTMLElement | string>('')
    onMounted(() => {
        windowListDropdown = new $bootstrap.Dropdown(windowListTogglerRef.value);
    })
    function ToggleWindowListCollapse(e) {
        isMenuOpen.value = false
        windowListDropdown._isShown() ? windowListDropdown.show() : windowListDropdown.hide();
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

            <div
                class="navbar-collapse collapse vv-navbar-menu"
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

            <div class="nav-item dropdown">
                <button
                    ref="windowListTogglerRef"
                    class="navbar-toggler vv-window-selector-toggler"
                    type="button"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-controls="windowList" aria-expanded="false" aria-label="Toggle the window list"
                    @click="ToggleWindowListCollapse"
                >
                    <span class="navbar-toggler-icon vv-window-selector-icon" />
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li
                        v-for="window in windowList"
                        :key="window.name"
                    >
                        <a
                            class="dropdown-item"
                            href="#"
                            @mousedown="SelectWindow(window)"
                        >
                            {{ window.name }}
                        </a>
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
    .vv-navbar-menu {
        order: 6;
    }
    @media (min-width: 992px) {
        .vv-navbar-menu {
            order: 4;
        }
    }
    .vv-window-selector-toggler {
        display: inline-block !important;
        order: 5;
    }
    .vv-window-selector-icon {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3crect stroke='rgba%28255, 255, 255, 0.55%29' stroke-width='2' fill='rgba%280,0,0,0.55%29' width='14' height='18' x='6' y='4'/%3e%3crect stroke='rgba%28255, 255, 255, 0.75%29' stroke-width='2' fill='white' width='14' height='18' x='10' y='9'/%3e%3c/svg%3e")
    }
    .vv-navbar-window-list {
        order: 7;
    }
</style>
