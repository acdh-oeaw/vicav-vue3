<script setup lang="ts">
import "v3-infinite-loading/lib/style.css";

import {
	AlignVerticalSpaceBetween,
	ChevronsLeftRightEllipsis,
	Copy,
	Languages,
} from "lucide-vue-next";
import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";
import type { z } from "zod";

import type { Div, U } from "@/lib/api-client";
import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";
import type { CorpusTextSchema } from "@/types/global.ts";

const props = defineProps<{
	params: z.infer<typeof CorpusTextSchema>["params"] & { label?: string };
}>();

const toastStore = useToastsStore();
const { simpleItems, persons } = useTeiHeadersStore();
const teiHeader = simpleItems.find((header) => header.id === props.params.textId);
const resolvePersonNameById = computed(() => {
	return function (personId: string | undefined): string | undefined {
		if (!personId) return undefined;

		return persons.find((person) => person["@id"] === personId)?.name?.$;
	};
});

const currentPage = ref(1);
const infinite = ref<typeof InfiniteLoading | null>(null);
const scrollComplete = ref<boolean>(false);
const utterancesWrapper = ref<HTMLElement | null>(null);

const annotationBlocks = ref<Array<Div>>([]);
const displayAnnotationBlocks = ref<Array<Div>>([]);
const inlineAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);
const denseTeiHeader = ref<false | true | "indeterminate">(true);

function hasTokenAnnotation(token: U["$$"][number]): boolean {
	if (token.w) {
		return (
			token.w["@lemmaRef"] != null ||
			token.w["@msd"] != null ||
			token.w.pos != null ||
			token.w.synRoot != null ||
			token.w.diaRoot != null
		);
	}

	return token.seg?.["$$"].some(hasTokenAnnotation) ?? false;
}

const hasInlineAnnotations = computed(() => {
	return annotationBlocks.value.some((div) =>
		getUtterances(div).some((utterance) => utterance["$$"].some(hasTokenAnnotation)),
	);
});

const hasInlineTranslations = computed(() => {
	return annotationBlocks.value.some((div) => div.Translation_spanGrp != null);
});

const showInlineAnnotations = computed(() => {
	return hasInlineAnnotations.value && inlineAnnotations.value === true;
});

const showInlineTranslations = computed(() => {
	return hasInlineTranslations.value && inlineTranslations.value === true;
});

const enabledOptions = computed<Array<string>>({
	get() {
		return [
			...(showInlineAnnotations.value ? ["annotations"] : []),
			...(showInlineTranslations.value ? ["translations"] : []),
			...(denseTeiHeader.value === true ? ["dense-tei-header"] : []),
		];
	},
	set(values: Array<string>) {
		inlineAnnotations.value = hasInlineAnnotations.value && values.includes("annotations");
		inlineTranslations.value = hasInlineTranslations.value && values.includes("translations");
		denseTeiHeader.value = values.includes("dense-tei-header");
	},
});

const api = useApiClient();

function getUtterances(div: Div): Array<U> {
	return [div.u, ...(div.us ?? [])].filter((u) => u !== undefined);
}

function renderUtteranceTokenText(token: U["$$"][number]): string {
	if (token.w) {
		let renderedText = token.w["$"];
		renderedText +=
			token.w["@join"] === "right" && token.w["@rendition"] === "rend:dashAfter" ? "-" : "";
		renderedText += token.w["@rendition"] === "rend:ellipsisAfter" ? "..." : "";
		renderedText +=
			token.w["@join"] === "right" && token.w["@rendition"] === "rend:withBowBelow" ? "_" : "";
		renderedText += token.w["@join"] === "right" ? "" : " ";
		return renderedText;
	}

	if (token.pc) {
		return `${token.pc["$"]} `;
	}

	if (token.gap) {
		return token.gap["@rendition"] === "rend:ellipsisInSquareBrackets" ? "[...] " : "";
	}

	if (token.seg) {
		return token.seg["$$"].map(renderUtteranceTokenText).join("");
	}

	return "";
}

function getRowText(div: Div): string {
	return getUtterances(div)
		.map((utterance) =>
			utterance["$$"].map(renderUtteranceTokenText).join("").replace(/\s+/g, " ").trim(),
		)
		.filter(Boolean)
		.join("\n");
}

async function copyRowText(div: Div) {
	try {
		await navigator.clipboard.writeText(getRowText(div));
		toastStore.addToast({
			title: "Copied",
			description: "Transcription copied to clipboard.",
			type: "foreground",
		});
	} catch (error) {
		toastStore.addToast({
			title: "Copy failed",
			description: error instanceof Error ? error.message : "Could not copy transcription.",
			type: "foreground",
			variant: "negative",
		});
	}
}

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
					<Tooltip v-if="hasInlineAnnotations">
						<TooltipTrigger as-child>
							<ToggleGroupItem class="hover:bg-primary" value="annotations">
								<ChevronsLeftRightEllipsis class="h-4 w-4" />
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent class="border-black bg-black text-white">
							Show inline linguistic annotations in utterances.
						</TooltipContent>
					</Tooltip>
					<Tooltip v-if="hasInlineTranslations">
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
						<th class="w-[10px] px-6 py-3" scope="col">Audio</th>
						<th class="w-[10px] px-2 py-3" scope="col"></th>
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
						<td class="px-2 align-middle">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger as-child>
										<Button size="icon" variant="ghost" @click="copyRowText(a)">
											<span class="sr-only">copy transcription</span>
											<Copy class="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white">
										copy transcription
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</td>
						<td class="min-w-fit px-3 font-bold">
							<div
								v-for="(u, uIndex) in getUtterances(a)"
								:key="uIndex"
								class="flex justify-center"
							>
								{{
									resolvePersonNameById(u["@who"]?.replace("corpus:", "")) ??
									u["@who"]?.replace("corpus:", "") ??
									"N/A"
								}}
							</div>
						</td>
						<td>
							<div class="flex flex-row">
								<div
									v-for="(u, uIndex) in getUtterances(a)"
									:key="uIndex"
									class="flex max-w-full flex-row flex-wrap px-6 py-3"
								>
									<CorpusTextJsonUtterance
										v-for="(uContent, index) in u['$$']"
										:key="index"
										:highlight="uContent.w?.['@id'] === props.params.hits"
										:inline-annotation="showInlineAnnotations"
										:inline-translation="showInlineTranslations"
										:utterance="uContent"
									></CorpusTextJsonUtterance>
								</div>
							</div>
							<div
								v-if="showInlineTranslations && a.Translation_spanGrp"
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
