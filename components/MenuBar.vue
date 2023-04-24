<script setup lang="ts">
    import { useWMStore } from '~~/store/wm';
    const WMStore = useWMStore()

    /*const { $api } = useNuxtApp();
    $api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
    try {
        let projectInfo = await $api.project.getProject({headers: { 'Accept': 'application/json' }});
        console.log(projectInfo);
    } catch (error) {
        console.error(error)
    }*/

    interface MenuItem {
        name: string,
        windowTypeId: string,
        params: null|Object,
    }

    const menu: MenuItem[] = [ // dummy menu for testing functionality
        {
            name: "Open map",
            windowTypeId: "WMap",
            params: null,
        },
        {
            name: "Query dictionaries",
            windowTypeId: "DictQuery",
            params: null,
        },
        {
            name: "Invalid test item",
            windowTypeId: "invalid-menu-item",
            params: null,
        }
    ]

    function ClickMenu(menuItem: MenuItem, e) {
        WMStore.Open(menuItem.windowTypeId, menuItem.params)
    }

</script>

<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
            <div class="vv-desktop-menu">
                Desktop menu
                <div
                    v-for="menuItem in menu"
                    :key="menuItem.id"
                    @mousedown="ClickMenu(menuItem, $event)"
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
