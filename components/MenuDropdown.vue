<template>
    <div class="nav-item dropdown">
        <a
            :id="menuItem.id"
            ref="buttonRef"
            @click="dropdown.show()"
            class="nav-link dropdown-toggle"
            role="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
        >
            {{ menuItem.name }}
        </a>
        <ul class="dropdown-menu"
            ref="menuRef"
            :aria-labelledby="menuItem.id">
            <li
                v-for="(m, i) in menuItem.submenu"
                :key="i"
            >
                <a
                    v-if="m.type === 'item'"
                    class="dropdown-item"
                    href="#"
                    @mousedown="ClickMenu(m)"
                >
                    {{ m.name }}
                </a>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { IMenuItem, IMenuSubmenu } from "~/store/appData";
    import { useWMStore } from '~~/store/wm';
    import { Dropdown } from "bootstrap";

    const WMStore = useWMStore()

    const { $bootstrap } = useNuxtApp()

    let dropdown: Dropdown | null = null;

    const props = defineProps<{
        menuItem: IMenuSubmenu;
    }>();

    function ClickMenu(menuItem: IMenuItem) {
        WMStore.Open(menuItem.windowTypeId, menuItem.params)
    }

    const buttonRef = ref<HTMLElement | null>(null)
    onMounted(() => {
        // Ensure that the Bootstrap 5 dropdown works properly
        dropdown = new $bootstrap.Dropdown(buttonRef.value);
    })
</script>

<style>
/* Add any custom styling here */
</style>
