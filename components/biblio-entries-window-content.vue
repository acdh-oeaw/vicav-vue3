<script lang="ts" setup>
interface Props {
	params: BibliographyEntriesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useBiblioTeiQuery(params);
const openNewWindowFromAnchor = useAnchorClickHandler();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const queryString: Ref<string> = ref(params.value.query);
const isTextQuery: Ref<boolean> = ref(true);
const isMapQuery: Ref<boolean> = ref(false);

function submitNewQuery(): void {
	if (!isTextQuery.value && !isMapQuery.value) isTextQuery.value = true;
	if (isTextQuery.value) {
		params.value.query = queryString.value;
	}
	if (isMapQuery.value) {
		console.log("map query not implemented");
	}
}
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		{{ queryString }} {{ isTextQuery }} {{ isMapQuery }}
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<div class="max-w-3xl px-8 pb-4 pt-8">
			<div class="dvStats">
				Query:&nbsp;&nbsp;
				<span class="spQueryText">{{ queryString }}</span>
			</div>
			<div class="max-w-3xl bg-gray-200 px-4">
				<div class="pt-3">
					<input
						v-model="queryString"
						type="text"
						class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
						placeholder="Search in bibliographies&hellip;"
					/>
				</div>
				<div class="my-3">
					<button class="biblQueryBtn" @click="submitNewQuery">Query</button>
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
		<div v-if="data" class="prose max-w-3xl p-8" v-html="data" />

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
	@apply w-full h-10 text-primary border-2 border-solid border-primary font-bold bg-on-primary inline-block text-center whitespace-nowrap align-middle rounded;
}

.biblQueryBtn:hover {
	@apply bg-primary text-on-primary;
}
</style>
