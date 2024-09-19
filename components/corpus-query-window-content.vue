<script setup lang="ts">
import type { CorpusSearchHits } from "@/lib/api-client";
import type { CorpusQuerySchema } from "@/types/global";

const api = useApiClient();
const { simpleItems } = useTEIHeaders();
const props = defineProps<{ params: Zod.infer<typeof CorpusQuerySchema>["params"] }>();
const queryString = ref(props.params.queryString);
const hits = ref<Array<CorpusSearchHits> | undefined>([]);

async function searchCorpus() {
	const result = await api.vicav.searchCorpus(
		{ query: queryString.value },
		{ headers: { Accept: "application/json" } },
	);

	if (result.error) {
		console.error(result.error);
		return;
	}
	hits.value = result.data.hits;
	hits.value.forEach((hit) => {
		const teiHeader = simpleItems.value.find((header) => header.id === hit.doc);
		hit.label = teiHeader.label;
	});
}

const openNewWindowFromAnchor = useAnchorClickHandler();

const { data: config } = useProjectInfo();
const specialCharacters = config.value?.projectConfig?.specialCharacters as Array<string>;
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div class="p-2">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<InputExtended
				v-model="queryString"
				aria-label="Search"
				placeholder="Search in corpus ..."
				:string-snippets="specialCharacters"
				@submit="searchCorpus"
			/>
			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="queryString === ''"
				@click.prevent.stop="searchCorpus"
			>
				Query
			</button>
			<br />
		</form>
		<div>
			<div v-if="hits === undefined || hits.length > 0" class="my-2">
				Query: "{{ queryString }}"
			</div>
			<table>
				<tr v-for="hit in hits" :key="hit.u">
					<td class="p-0">
						<a
							:data-hits="hit.docHits"
							:data-label="hit.label"
							data-target-type="CorpusText"
							:data-text-id="hit.doc"
							:data-u="hit.u"
							href="#"
							@click="openNewWindowFromAnchor"
						>
							<strong>{{ hit.u }}</strong>
						</a>
					</td>
					<td class="pl-5 text-right" v-html="hit.content?.left"></td>
					<td class="max-w-fit bg-[beige] px-[2px] text-center" v-html="hit.content?.kwic"></td>
					<td class="p-0" v-html="hit.content?.right"></td>
				</tr>
			</table>
		</div>
	</div>
</template>
