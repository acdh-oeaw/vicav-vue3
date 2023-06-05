<template>
    <div v-if="menuNode.type==='submenu'"
        class="nav-item dropdown"
    >
        <a
            :id="menuNode.id"
            ref="buttonRef"
            @click="toggleMenu(dropdown)"
            class="nav-link dropdown-toggle"
            role="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
        >
            {{ menuNode.name }}
        </a>
        <ul class="dropdown-menu"
            :aria-labelledby="menuNode.id">
            <li
                v-for="(m, i) in menuNode.submenu"
                :key="i"
            >
                <MenuNode
                    :menu-node="m"
                />
            </li>
        </ul>
    </div>
    <div v-if="menuNode.type==='item'">
        <a
            class="dropdown-item"
            href="#"
            @mousedown="ClickMenu(menuNode)"
        >
            {{ menuNode.name }}
        </a>
    </div>
    <div v-if="menuNode.type==='separator'">
        <div class="dropdown-divider"></div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { IMenuNode } from "~/store/appData";
    import { useWMStore } from '~~/store/wm';
    import { Dropdown } from "bootstrap";

    const WMStore = useWMStore()

    const { $bootstrap } = useNuxtApp()

    let dropdown: Dropdown | null = null;

    const props = defineProps<{
        menuNode: IMenuNode;
    }>();

    function ClickMenu(menuNode: IMenuNode) {
        if (menuNode.type === 'item') {
            WMStore.Open(menuNode.windowTypeId, menuNode.params)
        }
    }

    function toggleMenu(dropdown: Dropdown | null) {
        if (dropdown == null) {
            return
        }
        dropdown._isShown() ? dropdown.show() : dropdown.hide();
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
