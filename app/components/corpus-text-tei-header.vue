<script setup lang="ts">
import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";

const props = defineProps<{
	textId: string;
}>();

const { simpleItems } = useTeiHeadersStore();

const teiHeader = computed(() => {
	return simpleItems.find((header) => header.id === props.textId);
});

const publication = computed(() => {
	return teiHeader.value?.publication;
});
</script>

<template>
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
							teiHeader?.["transfer to ELAN"]?.map((p) => [p.given, p.family].join(" ")).join(", ")
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
</template>
