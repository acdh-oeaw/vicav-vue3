<template>
    <div class="nav-item dropdown">
        <a
            :id="menuNode.id"
            ref="buttonRef"
            @click="ToggleMenu(dropdown)"
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
                <VicavMenuNode
                    :menu-node="m"
                />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { Dropdown } from "bootstrap";
    import { IMenuSubmenu } from "~/store/appData";

    const props = defineProps<{
        menuNode: IMenuSubmenu;
    }>();

    const { $bootstrap } = useNuxtApp()

    let dropdown: Dropdown | null = null;

    function ToggleMenu(dropdown: Dropdown | null) {
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