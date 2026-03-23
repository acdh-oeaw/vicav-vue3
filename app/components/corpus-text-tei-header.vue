<script setup lang="ts">
import { Contact } from "lucide-vue-next";

import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";

const props = defineProps<{
	dense?: boolean;
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
		<table class="w-full">
			<thead>
				<tr></tr>
				<tr></tr>
			</thead>
			<tbody>
				<tr>
					<th class="w-fit pr-4 text-left whitespace-nowrap">Recording:</th>
					<td>
						{{ teiHeader?.recording?.map((p) => [p.given, p.family].join(" ")).join(", ") }}
					</td>
				</tr>
				<tr>
					<th class="w-fit pr-4 text-left whitespace-nowrap">Recording date:</th>
					<td>{{ teiHeader?.recordingDate }}</td>
				</tr>
				<tr>
					<th class="w-fit pr-4 text-left whitespace-nowrap">Transcribed by:</th>
					<td>
						{{ teiHeader?.transcription?.map((p) => [p.given, p.family].join(" ")).join(", ") }}
					</td>
				</tr>
				<tr v-if="teiHeader?.hasOwnProperty('transfer to ELAN')">
					<th class="w-fit pr-4 text-left whitespace-nowrap">Transferred to ELAN:</th>
					<td>
						{{
							teiHeader?.["transfer to ELAN"]?.map((p) => [p.given, p.family].join(" ")).join(", ")
						}}
					</td>
				</tr>
				<tr v-if="publication">
					<th class="w-fit pr-4 text-left align-text-top whitespace-nowrap">Published in:</th>
					<td>
						<Citation v-bind="publication" />
					</td>
				</tr>
				<tr>
					<th class="w-fit pr-4 text-left align-text-top whitespace-nowrap">Speakers:</th>
					<td class="w-full">
						<div class="flex flex-wrap gap-3">
							<Card
								v-for="(person, index) in teiHeader?.person"
								:key="index"
								class="rounded-sm border-border bg-background shadow-sm ring-1 ring-black/5"
							>
								<template v-if="props.dense">
									<CardContent class="flex items-center gap-3 px-3 py-2 whitespace-nowrap">
										<Contact class="size-4 shrink-0" />
										<p class="text-sm font-medium">{{ person.name }}</p>
										<p class="text-muted-foreground text-sm">
											Age: {{ person.age }} | DOB: {{ person.dob }} | Sex: {{ person.sex }}
										</p>
									</CardContent>
								</template>
								<template v-else>
									<CardHeader class="rounded-t-lg border-b bg-muted/40 pb-3">
										<CardTitle class="flex items-center gap-3 text-base leading-tight">
											<Contact class="size-5 shrink-0" />
											<span class="ml-auto text-right">{{ person.name }}</span>
										</CardTitle>
									</CardHeader>
									<CardContent class="space-y-2 pt-4">
										<div
											class="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/60 px-3 py-1.5"
										>
											<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">Age</p>
											<p class="text-sm font-medium">
												{{ person.age }}
											</p>
										</div>
										<div
											class="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/60 px-3 py-1.5"
										>
											<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">
												Date of Birth
											</p>
											<p class="text-sm font-medium">
												{{ person.dob }}
											</p>
										</div>
										<div
											class="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/60 px-3 py-1.5"
										>
											<p class="text-[11px] font-semibold tracking-[0.14em] uppercase">Sex</p>
											<p class="text-sm font-medium">
												{{ person.sex }}
											</p>
										</div>
									</CardContent>
								</template>
							</Card>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
