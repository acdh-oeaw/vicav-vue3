<script setup lang="ts"></script>

<template>
	<footer
		class="inset-x-0 bottom-0 h-7 bg-surface text-on-surface transition duration-500"
		onmouseleave="document.querySelector('footer').classList.remove('-translate-y-80')"
	>
		<div class="flex items-center gap-2 border px-8 py-1.5 text-xs">
			<div
				class="h-4 flex-1"
				onmouseover="document.querySelector('footer').classList.add('-translate-y-80')"
			></div>
			<span class="flex gap-1">
				<span>&copy; {{ new Date().getUTCFullYear() }}</span>
				<a class="hover:underline hover:underline-offset-2" href="https://www.oeaw.ac.at/acdh">
					ACDH-CH
				</a>
			</span>
			<span>|</span>
			<NuxtLink class="hover:underline hover:underline-offset-2" href="/imprint">Imprint</NuxtLink>
			<div
				class="h-4 flex-1"
				onmouseover="document.querySelector('footer').classList.add('-translate-y-80')"
			></div>
		</div>
		<div class="mb-0 w-full bg-neutral-50 px-0 text-gray-900">
			<div id="footer-full-content" class="mx-auto w-full px-4" tabindex="-1">
				<div
					class="footer-logo-widget mb-4 flex items-center border-b pb-4 pt-2 text-sm font-semibold"
				>
					<svg
						class="mr-1 w-4 max-w-full align-bottom"
						fill="none"
						height="24"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						viewBox="0 0 24 24"
						width="24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
						></path>
					</svg>
					CONTACT
				</div>
				<div class="-mx-4 flex flex-wrap">
					<div class="mt-4 w-1/4 flex-none px-4 sm:w-1/6 md:w-1/6 lg:w-1/12">
						<div class="">
							<a href="/">
								<img
									alt="ACDH Logo"
									src="https://fundament.acdh.oeaw.ac.at/common-assets/images/acdh_logo.svg"
									style="max-width: 100%; height: auto"
									title="ACDH Logo"
								/>
							</a>
						</div>
					</div>
					<!-- .footer-widget -->
					<div class="footer-widget mt-4 w-3/4 flex-none px-4 sm:w-1/2 md:w-1/3 lg:w-1/3">
						<div>
							<p class="mb-4 mt-0 block">
								ACDH-CH
								<br />
								Austrian Centre for Digital Humanities
								<br />
								and Cultural Heritage
								<br />
								Austrian Academy of Sciences
							</p>
							<p class="mb-4 mt-0 block">
								Bäckerstraße 13,
								<br />
								1010 Vienna
							</p>
							<p class="mb-4 mt-0 block">
								T: +43 1 51581-2200
								<br />
								E:
								<a href="mailto:acdh-ch@oeaw.ac.at">acdh-ch@oeaw.ac.at</a>
							</p>
						</div>
					</div>
					<!-- .footer-widget -->
					<div class="footer-widget ml-auto mt-4 w-full flex-none px-4 sm:w-1/3 md:w-1/3 lg:w-1/4">
						<h6 class="mb-2 block font-bold">HELPDESK</h6>
						<p class="mb-4 mt-0 block">
							ACDH-CH runs a helpdesk offering advice for questions related to various digital
							humanities topics.
						</p>
						<p class="mb-4 mt-0 block">
							<a
								class="block max-w-xs rounded-3xl border border-[#88dbdf] bg-white px-5 py-1 text-xs font-semibold text-[#88dbdf] transition-colors duration-200 ease-in-out hover:bg-[#88dbdf] hover:text-white"
								href="mailto:acdh-ch-helpdesk@oeaw.ac.at"
							>
								ASK US!
							</a>
						</p>
					</div>
					<!-- .footer-widget -->
				</div>
			</div>
		</div>
	</footer>
</template>

<style>
@media (width >= 640px) {
	/* sm */
	#footer-full-content {
		max-width: 540px;
	}
}

@media (width >= 768px) {
	/* md */
	#footer-full-content {
		max-width: 720px;
	}
}

@media (width >= 1024px) {
	/* lg */
	#footer-full-content {
		max-width: 960px;
	}
}

@media (width >= 1200px) {
	/* xl */
	#footer-full-content {
		max-width: 1140px;
	}
}

.footer-logo-widget {
	flex: 0 0 8.333%;
	max-width: 8.333%;
}

.footer-widget {
	flex: 0 0 33.333%;
	max-width: 33.333%;
}

@keyframes slide-in-out {
	0% {
		transform: translateY(0);
	}

	50% {
		transform: translateY(-20rem);
	}

	100% {
		transform: translateY(0);
	}
}

footer {
	animation-name: slide-in-out;
	animation-duration: 2s !important;
	animation-timing-function: ease-in-out;
	animation-delay: 500ms;
}
</style>
