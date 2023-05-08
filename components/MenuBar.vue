<script setup lang="ts">
    import { useWMStore } from '~~/store/wm';
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
                    v-for="menuItem, i in menu"
                    :key="i"
                    >
                    <div
                        v-if="menuItem.type == 'submenu'"
                        class="nav-item dropdown"
                        >
                        <a
                            :id="menuItem.id"
                            class="nav-link dropdown-toggle"
                            href="#"
                            role="button"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                            >
                            {{ menuItem.name }}
                        </a>
                        <div
                            class="dropdown-menu"
                            :aria-labelledby="menuItem.id"
                            >
                            <div
                                v-for="m, i in menuItem.submenu"
                                :key="i"
                                >
                                <a
                                    v-if="m.type == 'item'"
                                    class="dropdown-item"
                                    href="#"
                                    >
                                    {{ m.name }}
                                </a>
                            </div>
                        </div>
                    </div>
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