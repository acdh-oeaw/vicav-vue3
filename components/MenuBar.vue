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
            name: "Valid test item",
            windowTypeId: "DisplayHtml",
            params: {
                content: '\n\
                    <h1>Lorem Ipsum Dolor Sit Amet</h1>\n\
                    <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla, illo ducimus aspernatur iusto voluptatem repellendus maiores incidunt minus temporibus ea itaque blanditiis debitis eos dolor pariatur, qui animi molestias? Temporibus.</div>\n\
                    <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut iusto nobis sint sequi, commodi omnis modi libero, maiores reprehenderit nemo facere odit labore quibusdam consequatur voluptas doloremque iste a explicabo in perspiciatis fugit praesentium architecto veritatis. Autem distinctio corporis dolore hic adipisci, fugit sapiente minus quisquam iure quis repellat exercitationem pariatur! Asperiores optio tempora neque eos. Earum quidem voluptatum praesentium dicta corrupti aut expedita est harum libero nemo velit ducimus ex labore consectetur, repellat dignissimos qui sapiente! In, minima perspiciatis fugiat magnam facere voluptatum eligendi soluta sequi repellat pariatur consequuntur ut voluptatem placeat fugit praesentium veritatis voluptatibus quos incidunt aperiam ipsa, deserunt recusandae maxime esse unde. Ipsum nemo nulla hic ex quos facere a veniam numquam distinctio suscipit repellat impedit possimus quo quasi dolor, cupiditate ipsa. Sequi nobis eius corporis, natus labore a itaque repellat sed quo fugiat. Vel ipsum perspiciatis, laboriosam aspernatur, asperiores praesentium ad corporis aliquid incidunt eius magni commodi at officia rem id necessitatibus delectus esse ex sapiente molestiae! Suscipit nam placeat beatae maiores provident reprehenderit? Neque officia tenetur beatae, nam vel reiciendis praesentium eos quidem dignissimos dolores, assumenda ipsa eum ratione, ullam excepturi impedit libero saepe odit blanditiis! Tempore, porro dolor? Quidem dolore modi debitis rerum.</div>\n\
                ',
            },
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
            <a class="vv-navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
            <div class="vv-desktop-menu">
                Desktop menu
                <div
                    v-for="menuItem in menu"
                    :key="menuItem.name"
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

<style>
    .vv-navbar-brand > img {
        height: 52px;
    }
    .vv-desktop-menu-item {
        cursor: pointer;
    }
</style>