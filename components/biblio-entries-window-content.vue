<script lang="ts" setup>
import { nanoid } from "nanoid";
import { Collapse, initTE } from "tw-elements";

import type { BibliographyEntriesWindowItem } from "@/types/global.d";

interface Props {
	params: BibliographyEntriesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const emit = defineEmits(["updateQueryParam"]);

const formId = "biblioQueryForm-" + nanoid();
let isFormOpen = ref(false);
const { data, isPending, isPlaceholderData } = useBiblioTeiQuery(params);
const openNewWindowFromAnchor = useAnchorClickHandler();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const queryString: Ref<string> = ref(params.value.queryString);
const isTextQuery: Ref<boolean> = ref(true);
const isMapQuery: Ref<boolean> = ref(false);

function submitNewQuery(): void {
	if (!isTextQuery.value && !isMapQuery.value) isTextQuery.value = true;
	if (isTextQuery.value) {
		params.value.queryString = queryString.value;
		emit("updateQueryParam", queryString.value);
	}
	if (isMapQuery.value) {
		alert("map query not implemented");
	}
}

onMounted(() => {
	initTE({ Collapse });
	let formElement = document.getElementById(formId);
	formElement?.addEventListener("show.te.collapse", () => {
		isFormOpen.value = true;
	});
	formElement?.addEventListener("hidden.te.collapse", () => {
		isFormOpen.value = false;
	});
	new Collapse(formElement, {
		toggle: queryString.value === "",
	});
});
</script>

<template>
	<div
		class="relative isolate h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<div class="prose max-w-3xl px-8 pb-4 pt-8">
			<button
				class="dvStats flex w-full items-baseline"
				type="button"
				tabindex="0"
				data-te-collapse-init
				:data-te-target="`#${formId}`"
				aria-expanded="false"
				aria-controls="queryForm"
			>
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
							viewBox="0 0 1024 1024"
							version="1.1"
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
							viewBox="0 0 1024 1024"
							version="1.1"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M511.5 259.3 942.4 690.1c22.8 22.8 22.8 59.8 0 82.6-22.8 22.8-59.8 22.8-82.6 0L511.5 424.5 163.2 772.8c-22.8 22.8-59.8 22.8-82.6 0-22.8-22.8-22.8-59.8 0-82.6L511.5 259.3 511.5 259.3zM511.5 259.3"
							/>
						</svg>
					</div>
				</div>
			</button>
			<div :id="formId" class="!visible hidden max-w-3xl bg-gray-200 px-4" data-te-collapse-item>
				<div class="pt-3">
					<input
						v-model="queryString"
						type="text"
						class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
						placeholder="Search in bibliographies&hellip;"
						@keyup.enter="submitNewQuery"
					/>
				</div>
				<div class="my-3">
					<button class="biblQueryBtn" :disabled="!queryString" @click="submitNewQuery">
						Query
					</button>
				</div>
				<div class="mb-5 mt-2 flex">
					<div class="flex flex-1 items-start">
						<div class="flex h-5 items-center">
							<input
								id="isTextQuery"
								v-model="isTextQuery"
								type="checkbox"
								class="focus:ring-3 h-4 w-4 rounded border border-gray-300 bg-gray-50 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-800"
							/>
						</div>
						<label
							for="isTextQuery"
							class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
						>
							Display as text
						</label>
					</div>
					<div class="flex flex-1 items-start">
						<div class="flex h-5 items-center">
							<input
								id="isMapQuery"
								v-model="isMapQuery"
								type="checkbox"
								class="focus:ring-3 h-4 w-4 rounded border border-gray-300 bg-gray-50 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary dark:focus:ring-offset-gray-800"
							/>
						</div>
						<label
							for="isMapQuery"
							class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
						>
							Display on map
						</label>
					</div>
				</div>
				<div class="pb-4">
					<p>
						For details as to how to formulate meaningful queries in the bibliography
						<a
							class="aVicText"
							href="/"
							data-target-type="Text"
							data-text-id="li_vicavExplanationBibliography"
							@click="openNewWindowFromAnchor"
						>
							click here
						</a>
						<!-- TODO: remove the linebreak before the punctuation so that it sticks to the html end tag and find the linting rule to ignore -->
						.
					</p>
				</div>
			</div>
		</div>

		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="queryString && data" class="prose mb-auto max-w-3xl p-8" v-html="data" />

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
