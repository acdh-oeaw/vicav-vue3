<script setup lang="ts">
import "v3-infinite-loading/lib/style.css";

import { AlignVerticalSpaceBetween, ChevronsLeftRightEllipsis, Languages } from "lucide-vue-next";
import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";
import type { z } from "zod";

import type { Div } from "@/lib/api-client";
import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";
import type { CorpusTextSchema } from "@/types/global.ts";

const props = defineProps<{
	params: z.infer<typeof CorpusTextSchema>["params"] & { label?: string };
}>();

const { simpleItems } = useTeiHeadersStore();
const teiHeader = simpleItems.find((header) => header.id === props.params.textId);

const currentPage = ref(1);
const infinite = ref<typeof InfiniteLoading | null>(null);
const scrollComplete = ref<boolean>(false);
const utterancesWrapper = ref<HTMLElement | null>(null);

const annotationBlocks = ref<Array<Div>>([]);
const displayAnnotationBlocks = ref<Array<Div>>([]);
const inlineAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);
const denseTeiHeader = ref<false | true | "indeterminate">(true);
const enabledOptions = computed<Array<string>>({
	get() {
		return [
			...(inlineAnnotations.value === true ? ["annotations"] : []),
			...(inlineTranslations.value === true ? ["translations"] : []),
			...(denseTeiHeader.value === true ? ["dense-tei-header"] : []),
		];
	},
	set(values: Array<string>) {
		inlineAnnotations.value = values.includes("annotations");
		inlineTranslations.value = values.includes("translations");
		denseTeiHeader.value = values.includes("dense-tei-header");
	},
});

const api = useApiClient();
const loadNextPage = async function () {
	const text = await api.vicav.getCorpusText(
		{
			id: props.params.textId,
			hits: props.params.hits, //currently has no effect
			page: 1,
			size: 1000,
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
	currentPage.value += 1;
	const nextHits = annotationBlocks.value.slice(
		currentPage.value * 10,
		(currentPage.value + 1) * 10,
	);
	if (nextHits.length > 0) {
		displayAnnotationBlocks.value = displayAnnotationBlocks.value.concat(nextHits);
		$state.loaded();
	} else {
		scrollComplete.value = true;
		$state.complete();
	}
};

onMounted(async () => {
	await loadNextPage();
	await nextTick();

	if (props.params.hits) {
		utterancesWrapper.value
			?.querySelector<HTMLElement>(`#${CSS.escape(props.params.hits)}`)
			?.scrollIntoView({ block: "center" });
	}
});
</script>

<template>
	<div>
		<div class="sticky top-0 z-10 flex justify-end bg-white p-4">
			<TooltipProvider>
				<ToggleGroup v-model="enabledOptions" type="multiple" variant="outline">
					<Tooltip>
						<TooltipTrigger as-child>
							<ToggleGroupItem class="hover:bg-primary" value="annotations">
								<ChevronsLeftRightEllipsis class="h-4 w-4" />
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent class="border-black bg-black text-white">
							Show inline linguistic annotations in utterances.
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger as-child>
							<ToggleGroupItem class="hover:bg-primary" value="translations">
								<Languages class="h-4 w-4" />
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent class="border-black bg-black text-white">
							Show inline translations and translation rows.
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger as-child>
							<ToggleGroupItem class="hover:bg-primary" value="dense-tei-header">
								<AlignVerticalSpaceBetween class="h-4 w-4" />
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent class="border-black bg-black text-white">
							Collapse TEI header.
						</TooltipContent>
					</Tooltip>
				</ToggleGroup>
			</TooltipProvider>
		</div>
		<div v-if="params.showCitation">
			<Citation :header="teiHeader" type="entry" />
		</div>
		<!-- eslint-disable tailwindcss/no-custom-classname, vue/no-v-html -->
		<div :id="params.textId" ref="utterancesWrapper" class="relative inline-block p-4">
			<h2 class="m-3 text-lg">{{ props.params.label }}</h2>

			<CorpusTextTeiHeader :dense="denseTeiHeader === true" :text-id="params.textId" />
			<table class="text-sm text-gray-700">
				<thead class="bg-primary text-xs text-gray-700 uppercase">
					<tr>
						<th class="w-2.5 px-6 py-3" scope="col">Audio</th>
						<th class="w-30 px-6 py-3" scope="col">SpeakerID</th>
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
										:highlight="uContent.w?.['@id'] === props.params.hits"
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
