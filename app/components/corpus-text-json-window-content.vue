<script setup lang="ts">
import "v3-infinite-loading/lib/style.css";

import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";
import type { z } from "zod";

import type { Div } from "@/lib/api-client";
import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";
import type { CorpusTextSchema, VicavHTTPError } from "@/types/global.ts";

const props = defineProps<{
	params: z.infer<typeof CorpusTextSchema>["params"] & { label?: string };
}>();

const { simpleItems } = useTeiHeadersStore();
const teiHeader = simpleItems.find((header) => header.id === props.params.textId);

const currentPage = ref(1);
const infinite = ref<typeof InfiniteLoading | null>(null);
const scrollComplete = ref<boolean>(false);

const annotationBlocks = ref<Array<Div>>([]);
const inlineAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);

const api = useApiClient();
const loadNextPage = async function () {
	const text = await api.vicav.getCorpusText(
		{
			id: props.params.textId,
			hits: props.params.hits,
			page: currentPage.value,
			size: 10,
			render: "json",
		},
		{ headers: { Accept: "application/json" } },
	);
	if ("doc" in text.data && text.data.doc !== undefined) {
		const newDivs: Array<Div> = [];
		text.data.doc.divs.forEach((div) => {
			if (div.u && Array.isArray(div.u.$$)) {
				newDivs.push(div);
			} else if (div.us && Array.isArray(div.us)) {
				div.us.forEach((u, i) => {
					const newDiv: Div = { ...div, us: [u] };
					if (i + 1 !== div.us?.length) {
						delete newDiv.Translation_spanGrp;
					}
					newDivs.push(newDiv);
				});
			}
		});
		annotationBlocks.value = annotationBlocks.value.concat(newDivs);
		currentPage.value = currentPage.value + 1;
	}
	return text;
};

const handleInfiniteScroll = async function ($state: StateHandler) {
	try {
		const text = await loadNextPage();
		$state.loaded();
		if ("doc" in text.data && text.data.doc !== undefined && text.data.doc.divs.length < 10) {
			scrollComplete.value = true;
			$state.complete();
		}
	} catch (e) {
		const err = e as VicavHTTPError;
		if (err.status === 404 && err.error?.detail?.indexOf("does not have page") !== -1) {
			scrollComplete.value = true;
			$state.complete();
			return;
		}

		$state.error();
	}
};

onMounted(async () => {
	await loadNextPage();
});
</script>

<template>
	<div>
		<div class="flex justify-end p-4">
			<div>
				<Checkbox
					id="switch-annotations"
					:default-checked="true"
					@update:checked="inlineAnnotations = !inlineAnnotations"
				/>
				<label for="switch-annotations">&nbsp;Inline Annotations</label>
			</div>
			&nbsp;
			<div>
				<Checkbox
					id="switch-translations"
					:default-checked="true"
					@update:checked="inlineTranslations = !inlineTranslations"
				/>
				<label for="switch-translations">&nbsp;Inline Translations</label>
			</div>
		</div>
		<div v-if="params.showCitation">
			<Citation :header="teiHeader" type="entry" />
		</div>
		<!-- eslint-disable tailwindcss/no-custom-classname, vue/no-v-html -->
		<div :id="params.textId" ref="utterancesWrapper" class="relative max-w-full overflow-auto p-4">
			<h2 class="m-3 text-lg">{{ props.params.label }}</h2>

			<CorpusTextTeiHeader :text-id="params.textId" />
			<table class="w-full table-fixed text-sm text-gray-700">
				<thead class="bg-primary text-xs text-gray-700 uppercase">
					<tr>
						<th class="w-[10px] px-6 py-3" scope="col">Audio</th>
						<th class="w-[120px] px-6 py-3" scope="col">SpeakerID</th>
						<th class="px-6 py-3" scope="col">Utterance</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="a in annotationBlocks"
						:id="a['@id']"
						:key="a['@id']"
						ref="annotationBlocksWrapper"
						class="corpus-utterance u table-row even:bg-accent"
					>
						<td>
							<!-- audio player goes here -->
						</td>
						<td class="min-w-fit px-3 font-bold">
							<div
								v-for="(u, uIndex) in [a.u ?? a.u, a.us ?? a.us]
									.flat()
									.filter((u) => u !== undefined)"
								:key="uIndex"
								class="flex justify-center"
							>
								{{ u["@who"]?.replace("corpus:", "") || "N/A" }}
							</div>
						</td>
						<td>
							<div class="flex flex-row">
								<div
									v-for="(u, uIndex) in [a.u ?? a.u, a.us ?? a.us]
										.flat()
										.filter((u) => u !== undefined)"
									:key="uIndex"
									class="flex max-w-full flex-row flex-wrap px-6 py-3"
								>
									<CorpusTextJsonUtterance
										v-for="(uContent, index) in u['$$']"
										:key="index"
										:inline-annotation="inlineAnnotations as boolean"
										:inline-translation="inlineTranslations as boolean"
										:utterance="uContent"
									></CorpusTextJsonUtterance>
								</div>
							</div>
							<div
								v-if="inlineTranslations && a.Translation_spanGrp"
								class="flex max-w-full flex-row px-6 py-3 italic"
							>
								{{ a.Translation_spanGrp.span["$"] }}
							</div>
						</td>
					</tr>
				</tbody>
			</table>
			<InfiniteLoading v-if="!scrollComplete" ref="infinite" @infinite="handleInfiniteScroll" />
		</div>
	</div>
</template>
