<script lang="ts" setup>
import type { BibliographyEntriesWindowItem } from "@/types/global.d";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

interface Props {
	params: BibliographyEntriesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const emit = defineEmits(["updateQueryParam"]);

const { data, isPending, isPlaceholderData } = useBiblioTeiQuery(params);
const openNewWindowFromAnchor = useAnchorClickHandler();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const queryString: Ref<string> = ref(params.value.queryString);
const isTextQuery: Ref<boolean> = ref(true);
const isMapQuery: Ref<boolean> = ref(false);

const isFormOpen = ref(queryString.value === "");

function submitNewQuery(map: boolean): void {
	if (queryString.value === "") return;
	if (!isTextQuery.value && !isMapQuery.value) isTextQuery.value = true;
	params.value.queryString = queryString.value;
	emit("updateQueryParam", queryString.value);
	if (map) {
		addWindow({
			targetType: "WMap",
			params: {
				queryString: queryString.value,
				endpoint: "bibl_markers_tei",
			},
			title: `Bibl. Locations for "${queryString.value}"`,
		});
	}
	isFormOpen.value = false;
}

function submitNewQueryKeyup(event: KeyboardEvent): void {
	if (event.key === "Enter") {
		submitNewQuery(false);
	}
}
</script>

<template>
	<div
		class="relative isolate size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<Collapsible v-model:open="isFormOpen" class="prose max-w-3xl px-8 pb-4 pt-8">
			<CollapsibleTrigger class="dvStats flex w-full items-baseline">
				Query:&nbsp;&nbsp;
				<span class="spQueryText">{{ queryString }}</span>
				<div class="relative top-1 ml-auto mr-4">
					<div v-if="!isFormOpen">
						<svg
							class="svg-icon"
							style="
								vertical-align: middle;
								overflow: hidden;
								width: 1em;
								height: 1em;
								fill: currentColor;
							"
							version="1.1"
							viewBox="0 0 1024 1024"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M511.5 789.9 80.6 359c-22.8-22.8-22.8-59.8 0-82.6 22.8-22.8 59.8-22.8 82.6 0l348.3 348.3 348.3-348.3c22.8-22.8 59.8-22.8 82.6 0 22.8 22.8 22.8 59.8 0 82.6L511.5 789.9 511.5 789.9zM511.5 789.9"
							/>
						</svg>
					</div>
					<div v-if="isFormOpen">
						<svg
							class="svg-icon"
							style="
								vertical-align: middle;
								overflow: hidden;
								width: 1em;
								height: 1em;
								fill: currentColor;
							"
							version="1.1"
							viewBox="0 0 1024 1024"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M511.5 259.3 942.4 690.1c22.8 22.8 22.8 59.8 0 82.6-22.8 22.8-59.8 22.8-82.6 0L511.5 424.5 163.2 772.8c-22.8 22.8-59.8 22.8-82.6 0-22.8-22.8-22.8-59.8 0-82.6L511.5 259.3 511.5 259.3zM511.5 259.3"
							/>
						</svg>
					</div>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div class="max-w-3xl bg-gray-200 px-4">
					<div class="pt-3">
						<input
							v-model="queryString"
							class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
							placeholder="Search in bibliographies&hellip;"
							type="text"
							@keyup.enter="submitNewQueryKeyup"
						/>
					</div>
					<div class="my-3">
						<button class="biblQueryBtn" :disabled="!queryString" @click="submitNewQuery(false)">
							Query as List
						</button>
					</div>
					<div class="my-3">
						<button class="biblQueryBtn" :disabled="!queryString" @click="submitNewQuery(true)">
							Query as List & Map
						</button>
					</div>
					<div class="pb-4">
						<p>
							For details as to how to formulate meaningful queries in the bibliography
							<a
								class="aVicText"
								data-label="Bibliography (Details)"
								data-target-type="Text"
								data-text-id="li_vicavExplanationBibliography"
								href="/"
								@click="openNewWindowFromAnchor"
							>
								click here
							</a>
							<!-- TODO: remove the linebreak before the punctuation so that it sticks to the html end tag and find the linting rule to ignore -->
							.
						</p>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>

		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="data" class="prose mb-auto max-w-3xl p-8" v-html="data" />

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern, block-no-empty */
.dvStats {
	@apply mb-[5px] pb-[5px] pl-[5px] border border-solid border-primary bg-primary text-on-primary font-bold;
}

.spQueryText {
	@apply text-gray-200 italic;
}

.dvAuthor {
	@apply block border-t border-dotted border-primary;
}

.dvBiblBlock {
	@apply block ml-5 pb-2.5;
}

.imgBiblItem {
	@apply inline max-w-full m-0 border-none pr-1.5 align-middle box-border;
}

.dvBibBook,
.dvBibBookSection,
.dvBibArticle,
.dvThesis {
}

.dvBibArticle .fa-book,
.dvBibBook .fa-file-text,
.dvBibBookSection .fa-file-text {
	@apply block;
}

.biblQueryBtn {
	@apply w-full h-10 text-primary border-2 border-solid border-primary font-bold bg-on-primary inline-block text-center whitespace-nowrap align-middle rounded disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400;
}

.biblQueryBtn:hover {
	@apply bg-primary text-on-primary;
}
</style>
