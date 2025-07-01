<script setup lang="ts">
import "v3-infinite-loading/lib/style.css";

import { Pause, Play } from "lucide-vue-next";
import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";

import type { HttpResponse } from "@/lib/api-client";
import type { AnnotationBlock, AnnotationDoc } from "@/types/corpus-as-json";
import type { CorpusTextJSONSchema, VicavHTTPError } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof CorpusTextJSONSchema>["params"] & { label?: string };
}>();

const { simpleItems } = useTEIHeaders();
const teiHeader = simpleItems.value.find((header) => header.id === props.params.textId);
const publication = teiHeader?.publication;

const currentPage = ref(1);
const infinite = ref<typeof InfiniteLoading | null>(null);
const scrollComplete = ref<boolean>(false);

const annotationBlocks = ref<Array<AnnotationBlock>>([]);
const inlineAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);

const api = useApiClient();
const loadNextPage = async function () {
	const text = (await api.vicav.getCorpusText(
		{
			id: props.params.textId,
			hits: props.params.hits,
			page: currentPage.value,
			size: 10,
			render: "json",
		},
		{ headers: { Accept: "application/json" } },
	)) as unknown as HttpResponse<AnnotationDoc, string>;
	if (text.data.doc.annotationBlocks !== undefined) {
		annotationBlocks.value = annotationBlocks.value.concat(text.data.doc.annotationBlocks);
		currentPage.value = currentPage.value + 1;
	}
	return text;
};

const handleInfiniteScroll = async function ($state: StateHandler) {
	try {
		const text = await loadNextPage();
		$state.loaded();
		if (text.data.doc !== undefined && text.data.doc.annotationBlocks.length < 10) {
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
	loadNextPage();
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
		<div :id="params.textId" ref="utterancesWrapper" class="p-4 relative">
			<h2 class="m-3 text-lg">{{ props.params.label }}</h2>

			<div class="m-3 rounded-sm border border-gray-300 bg-gray-50 p-4">
				<table>
					<thead>
						<tr></tr>
						<tr></tr>
					</thead>
					<tbody>
						<tr>
							<th class="w-44">Recording:</th>
							<td>
								{{ teiHeader?.recording?.map((p) => [p.given, p.family].join(" ")).join(", ") }}
							</td>
						</tr>
						<tr>
							<th>Recording date:</th>
							<td>{{ teiHeader?.recordingDate }}</td>
						</tr>
						<tr>
							<th>Transcribed by:</th>
							<td>
								{{ teiHeader?.transcription?.map((p) => [p.given, p.family].join(" ")).join(", ") }}
							</td>
						</tr>
						<tr v-if="teiHeader?.hasOwnProperty('transfer to ELAN')">
							<th>Transferred to ELAN:</th>
							<td>
								{{
									teiHeader["transfer to ELAN"].map((p) => [p.given, p.family].join(" ")).join(", ")
								}}
							</td>
						</tr>
						<tr v-if="publication">
							<th class="align-text-top">Published in:</th>
							<td>
								<Citation v-bind="publication" />
							</td>
						</tr>
						<tr>
							<th>Speakers:</th>
							<td>
								<span v-for="(person, index) in teiHeader?.person" :key="index">
									{{ person.name }} (age: {{ person.age }}, sex: {{ person.sex }})
									<span v-if="index < (teiHeader?.person.length || 1) - 1">, </span>
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<table class="text-sm text-left rtl:text-right text-gray-700 w-full">
				<thead class="text-xs text-gray-700 uppercase bg-accent">
					<tr>
						<th class="px-6 py-3" scope="col">Audio</th>
						<th class="px-6 py-3" scope="col">SpeakerID</th>
						<th class="px-6 py-3" scope="col">Utterance</th>
					</tr>
				</thead>
				<tr
					v-for="a in annotationBlocks"
					:id="a['@id']"
					:key="a['@id']"
					ref="annotationBlocksWrapper"
					class="corpus-utterance u table-row"
				>
					<td>
						<a class="play mt-1">
							<Play class="size-4" />
							<span class="hidden">Play</span></a
						>
						<a class="stop mt-1 hidden">
							<Pause class="size-4" />
							<span class="hidden">Stop</span>
						</a>
						<!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
						<audio hidden="hidden">
							<source src="pending" />
						</audio>
					</td>
					<td class="min-w-fit px-3 font-bold">
						<div class="flex justify-center">{{ teiHeader?.id }}</div>
					</td>
					<td>
						<div class="px-6 py-3 max-w-full flex flex-row">
							<CorpusTextJsonUtterance
								v-for="(u, index) in a.u['$$']"
								:key="index"
								:inline-annotation="inlineAnnotations as boolean"
								:inline-translation="inlineTranslations as boolean"
								:no="index"
								:translation="a.spanGrp.span['$']"
								:utterance="u"
							></CorpusTextJsonUtterance>
						</div>
						<div v-if="inlineTranslations" class="px-6 py-3 max-w-full flex flex-row italic">
							{{ a.spanGrp.span["$"] }}
						</div>
					</td>
				</tr>
			</table>
			<InfiniteLoading v-if="!scrollComplete" ref="infinite" @infinite="handleInfiniteScroll" />
		</div>
	</div>
</template>
