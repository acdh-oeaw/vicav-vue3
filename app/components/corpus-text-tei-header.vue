<script setup lang="ts">
import { Contact } from "lucide-vue-next";

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
					<th class="align-text-top">Speakers:</th>
					<td>
						<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							<Card
								v-for="(person, index) in teiHeader?.person"
								:key="index"
								class="border-border/70 bg-background/80 shadow-none"
							>
								<CardHeader class="pb-3">
									<CardTitle class="flex items-center gap-3 text-base leading-tight">
										<Contact class="text-muted-foreground size-5 shrink-0" />
										<span class="ml-auto text-right">{{ person.name }}</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div
										class="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-1"
									>
										<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">Age</p>
										<p class="text-sm font-medium">
											{{ person.age }}
										</p>
									</div>
									<div
										class="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-1"
									>
										<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">
											Date of Birth
										</p>
										<p class="text-sm font-medium">
											{{ person.dob }}
										</p>
									</div>
									<div
										class="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-1"
									>
										<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">Sex</p>
										<p class="text-sm font-medium">
											{{ person.sex }}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
