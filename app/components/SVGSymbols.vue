<script lang="ts" setup>
import { characterIcons } from "./ui/icon-picker/character-icons.ts";
</script>

<template>
	<div id="svg-symbols" class="sr-only">
		<SvgoPetal />
		<SvgoLucideIcons />
		<!-- letters and digits usable as marker icons, referenced by id like the sprite symbols -->
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
			<symbol v-for="icon in characterIcons" :id="icon.name" :key="icon.name" viewBox="0 0 24 24">
				<text
					dominant-baseline="central"
					fill="inherit"
					font-family="ui-sans-serif, system-ui, sans-serif"
					font-size="22"
					font-weight="600"
					stroke="none"
					text-anchor="middle"
					x="12"
					y="12"
				>
					{{ icon.character }}
				</text>
			</symbol>
		</svg>
	</div>
</template>
