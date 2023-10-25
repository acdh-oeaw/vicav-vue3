<template>
	<footer class="border-t border-border bg-surface text-on-surface">
		<div class="flex items-center justify-center gap-2 px-8 py-1.5 text-xs">
			<span class="flex gap-1">
				<span>&copy; {{ new Date().getUTCFullYear() }}</span>
				<a class="hover:underline hover:underline-offset-2" href="https://www.oeaw.ac.at/acdh">
					ACDH-CH
				</a>
			</span>
			<span>|</span>
			<NuxtLink class="hover:underline hover:underline-offset-2" href="/imprint">Imprint</NuxtLink>
		</div>
	</footer>
</template>
