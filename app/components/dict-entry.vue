<script setup lang="ts">
import {
	BookA,
	Braces,
	ChevronDown,
	ChevronUp,
	Code,
	MapPin,
	MessageSquareQuote,
} from "lucide-vue-next";

import type { RestVLEEntry } from "@/lib/api-client";
import {
	formatLocation,
	normalizeEntry,
	type RenderedMetadataItem,
} from "@/utils/dict-entry-rendering";

const props = withDefaults(
	defineProps<{
		entry: RestVLEEntry;
		dictId?: string | number;
		debug?: boolean;
		expanded?: boolean;
	}>(),
	{
		debug: false,
		expanded: false,
	},
);

const env = useRuntimeConfig();

const e = computed(() => normalizeEntry(props.entry));
const isExpanded = ref(props.expanded);

watch(
	() => props.expanded,
	(value) => {
		isExpanded.value = value;
	},
);

const getEntryLink = (entryId: string | number | null | undefined, responseFormat?: "json") => {
	if (entryId == null || props.dictId == null) return undefined;

	const path = `/restvle/dicts/${props.dictId}/entries`;
	const url = env.public.apiBaseUrl
		? new URL(path, env.public.apiBaseUrl)
		: new URL(path, "http://localhost");
	url.searchParams.set("id", String(entryId));

	if (responseFormat != null) {
		url.searchParams.set("format", responseFormat);
	}

	return env.public.apiBaseUrl ? url.toString() : `${path}${url.search}`;
};

const shouldRenderFormMetadata = (item: RenderedMetadataItem) => {
	return !(item.label === "type" && item.value === "lemma");
};

const grammarHeaderStyles = [
	{
		label: "bg-amber-200 text-amber-950",
		value: "bg-amber-50/95 text-amber-950",
	},
	{
		label: "bg-sky-200 text-sky-950",
		value: "bg-sky-50/95 text-sky-950",
	},
	{
		label: "bg-emerald-200 text-emerald-950",
		value: "bg-emerald-50/95 text-emerald-950",
	},
	{
		label: "bg-rose-200 text-rose-950",
		value: "bg-rose-50/95 text-rose-950",
	},
	{
		label: "bg-violet-200 text-violet-950",
		value: "bg-violet-50/95 text-violet-950",
	},
];

const getGrammarHeaderStyle = (index: number) => {
	return grammarHeaderStyles[index % grammarHeaderStyles.length]!;
};

const sectionHeadingClass =
	"w-36 border-l-4 border-primary bg-primary/10 align-top text-xs font-black tracking-[0.12em] text-primary uppercase";

const toggleExpanded = () => {
	isExpanded.value = !isExpanded.value;
};

const expandEntry = () => {
	isExpanded.value = true;
};

const formatAvailableCount = (count: number, label: string) => {
	return `${count} ${label}${count === 1 ? "" : "s"} available`;
};
</script>

<template>
	<!-- eslint-disable tailwindcss/classnames-order, tailwindcss/no-custom-classname -->
	<div>
		<div v-if="debug" class="text-sm">
			<pre>{{ JSON.stringify(e.raw, null, "  ") }}</pre>
		</div>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-if="e.html" v-html="e.html" />
		<Card v-else class="overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm">
			<CardHeader class="gap-3 border-b border-primary bg-primary text-on-primary">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 flex-[1_1_70%]">
						<div class="flex items-start gap-3">
							<TooltipProvider
								v-if="e.type === 'entry' || e.type === 'example'"
								:delay-duration="0"
							>
								<Tooltip>
									<TooltipTrigger as-child>
										<button
											:aria-label="e.type"
											class="flex size-10 shrink-0 items-center justify-center rounded-sm border border-on-primary/40 bg-on-primary text-primary shadow-sm"
											type="button"
										>
											<BookA v-if="e.type === 'entry'" class="size-5" />
											<MessageSquareQuote v-else class="size-5" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										{{ e.type }}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div class="min-w-0 space-y-1">
								<CardTitle class="text-lg leading-snug text-on-primary">
									{{ e.title }}
								</CardTitle>
								<CardDescription
									v-if="e.location"
									class="text-sm font-semibold tracking-[0.08em] text-on-primary/80 uppercase"
								>
									{{ e.location }}
								</CardDescription>
								<div v-if="e.grammar.length > 0" class="mt-2 flex flex-wrap gap-1.5">
									<div
										v-for="(item, itemIndex) in e.grammar"
										:key="`header-grammar-${item.label}-${item.value}`"
										class="inline-flex overflow-hidden rounded-sm border border-on-primary/30 text-xs shadow-sm"
									>
										<span
											class="px-2 py-1 font-black tracking-[0.08em] uppercase"
											:class="getGrammarHeaderStyle(itemIndex).label"
										>
											{{ item.label }}
										</span>
										<span
											class="px-2 py-1 font-semibold"
											:class="getGrammarHeaderStyle(itemIndex).value"
										>
											{{ item.value }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						class="ml-4 flex min-w-0 max-w-[16rem] flex-[0_1_16rem] flex-col items-end gap-2 self-start"
					>
						<div class="flex items-center justify-end gap-2">
							<TooltipProvider :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<button
											:aria-label="isExpanded ? 'Collapse entry details' : 'Expand entry details'"
											class="flex size-8 items-center justify-center rounded-sm border border-on-primary/40 text-on-primary hover:bg-on-primary hover:text-primary"
											type="button"
											@click="toggleExpanded"
										>
											<ChevronUp v-if="isExpanded" class="size-4" />
											<ChevronDown v-else class="size-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										{{ isExpanded ? "collapse entry details" : "expand entry details" }}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<NuxtLink
											aria-label="entry as xml"
											class="flex size-8 items-center justify-center rounded-sm border border-on-primary/40 text-on-primary hover:bg-on-primary hover:text-primary"
											external
											rel="noopener noreferrer"
											target="_blank"
											:to="getEntryLink(e.id)"
										>
											<Code class="size-4" />
										</NuxtLink>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										view as xml
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<NuxtLink
											aria-label="entry as JSON"
											class="flex size-8 items-center justify-center rounded-sm border border-on-primary/40 text-on-primary hover:bg-on-primary hover:text-primary"
											external
											rel="noopener noreferrer"
											target="_blank"
											:to="getEntryLink(e.id, 'json')"
										>
											<Braces class="size-4" />
										</NuxtLink>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										view as JSON
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							<Badge v-if="e.id" variant="outline">id: {{ e.id }}</Badge>
							<Badge v-if="e.status && e.status !== 'released'" variant="outline">
								{{ e.status }}
							</Badge>
							<Badge
								v-for="item in e.metadata"
								:key="`${item.label}-${item.value}`"
								variant="outline"
							>
								{{ item.label }}: {{ item.value }}
							</Badge>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent class="pt-4">
				<Table>
					<TableBody>
						<TableRow v-if="e.lemmaForms.length > 0 || e.variantForms.length > 0">
							<TableCell :class="sectionHeadingClass">Forms</TableCell>
							<TableCell>
								<div class="space-y-3">
									<div
										v-for="(form, formIndex) in e.lemmaForms"
										:key="`lemma-${formIndex}`"
										class="space-y-2"
									>
										<div class="flex flex-wrap items-center gap-2">
											<Badge
												v-for="item in form.metadata.filter(shouldRenderFormMetadata)"
												:key="`lemma-${formIndex}-${item.label}-${item.value}`"
												variant="outline"
											>
												{{ item.label }}: {{ item.value }}
											</Badge>
										</div>
										<div class="flex flex-wrap items-center gap-2">
											<span
												v-for="orthography in form.orthographies"
												:key="`lemma-${formIndex}-${orthography.lang}-${orthography.text}`"
												class="inline-flex items-center gap-2"
												:class="{ 'text-muted-foreground': orthography.isMissing }"
											>
												<Badge v-if="orthography.lang" variant="outline">
													{{ orthography.lang }}
												</Badge>
												<span>{{ orthography.text }}</span>
											</span>
										</div>
									</div>
									<div
										v-for="(form, formIndex) in e.variantForms"
										:key="`variant-${formIndex}`"
										class="space-y-2 border-t border-border/60 pt-3"
									>
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-sm font-semibold">Variant</span>
											<Badge
												v-for="item in form.metadata.filter(shouldRenderFormMetadata)"
												:key="`variant-${formIndex}-${item.label}-${item.value}`"
												variant="outline"
											>
												{{ item.label }}: {{ item.value }}
											</Badge>
										</div>
										<div class="flex flex-wrap items-center gap-2">
											<span
												v-for="orthography in form.orthographies"
												:key="`variant-${formIndex}-${orthography.lang}-${orthography.text}`"
												class="inline-flex items-center gap-2"
												:class="{ 'text-muted-foreground': orthography.isMissing }"
											>
												<Badge v-if="orthography.lang" variant="outline">
													{{ orthography.lang }}
												</Badge>
												<span>{{ orthography.text }}</span>
											</span>
										</div>
										<div v-if="form.grammar.length > 0" class="space-y-1.5">
											<div
												v-for="item in form.grammar"
												:key="`variant-${formIndex}-${item.label}`"
												class="flex items-start gap-4"
											>
												<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
													{{ item.label }}
												</div>
												<div class="min-w-0 flex-1 text-sm font-normal">
													{{ item.value }}
												</div>
											</div>
										</div>
									</div>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.locations.length > 0">
							<TableCell :class="sectionHeadingClass">Locations</TableCell>
							<TableCell>
								<div class="flex flex-wrap gap-2">
									<Badge
										v-for="location in e.locations"
										:key="formatLocation(location)"
										class="inline-flex items-center gap-1"
										variant="outline"
									>
										<MapPin class="size-3" />
										{{ formatLocation(location) }}
									</Badge>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.quote">
							<TableCell :class="sectionHeadingClass">Quote</TableCell>
							<TableCell>
								<div class="space-y-2">
									<p class="m-0">{{ e.quote.text }}</p>
									<Badge v-if="e.quote.lang" variant="outline">{{ e.quote.lang }}</Badge>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.translations.length > 0">
							<TableCell :class="sectionHeadingClass">Translations</TableCell>
							<TableCell>
								<div class="space-y-2">
									<div
										v-for="translation in e.translations"
										:key="`${translation.lang}-${translation.text}`"
										class="flex flex-wrap items-center gap-2"
									>
										<Badge v-if="translation.lang" variant="outline">
											{{ translation.lang }}
										</Badge>
										<span>{{ translation.text }}</span>
									</div>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.inflectedForms.length > 0">
							<TableCell :class="sectionHeadingClass">Inflected Forms</TableCell>
							<TableCell>
								<div class="space-y-3">
									<Card
										v-for="(inflected, inflectedIndex) in e.inflectedForms"
										:key="`inflected-${inflectedIndex}`"
										class="rounded-sm border border-primary/30 shadow-none"
									>
										<CardContent class="space-y-2 pt-4">
											<div class="flex flex-wrap items-start justify-between gap-2">
												<div class="flex flex-wrap items-center gap-2">
													<Badge
														v-for="item in inflected.metadata"
														:key="`inflected-${inflectedIndex}-${item.label}-${item.value}`"
														variant="outline"
													>
														{{ item.label }}: {{ item.value }}
													</Badge>
												</div>
												<div
													v-if="inflected.locations.length > 0"
													class="ml-auto flex flex-wrap justify-end gap-2"
												>
													<Badge
														v-for="location in inflected.locations"
														:key="formatLocation(location)"
														class="inline-flex items-center gap-1"
														variant="outline"
													>
														<MapPin class="size-3" />
														{{ formatLocation(location) }}
													</Badge>
												</div>
											</div>
											<div class="flex flex-wrap items-center gap-2">
												<span
													v-for="orthography in inflected.orthographies"
													:key="`inflected-${inflectedIndex}-${orthography.lang}-${orthography.text}`"
													class="inline-flex items-center gap-2 font-medium"
													:class="{ 'text-muted-foreground': orthography.isMissing }"
												>
													<Badge v-if="orthography.lang" variant="outline">
														{{ orthography.lang }}
													</Badge>
													<span>{{ orthography.text }}</span>
												</span>
											</div>
											<div v-if="inflected.grammar.length > 0" class="space-y-1.5">
												<div
													v-for="item in inflected.grammar"
													:key="`inflected-${inflectedIndex}-${item.label}`"
													class="flex items-start gap-4"
												>
													<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
														{{ item.label }}
													</div>
													<div class="min-w-0 flex-1 text-sm font-normal">
														{{ item.value }}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.senses.length > 0">
							<TableCell :class="sectionHeadingClass">Senses</TableCell>
							<TableCell>
								<div class="space-y-4">
									<Card
										v-for="sense in e.senses"
										:key="sense.id ?? sense.translations.map((item) => item.text).join('|')"
										class="rounded-sm border border-primary/30 shadow-none"
									>
										<CardContent class="space-y-3 pt-4">
											<div class="flex flex-wrap items-center gap-2">
												<Badge v-if="sense.ana" variant="outline">{{ sense.ana }}</Badge>
												<Badge
													v-for="item in sense.metadata"
													:key="`${sense.id}-${item.label}-${item.value}`"
													variant="outline"
												>
													{{ item.label }}: {{ item.value }}
												</Badge>
											</div>
											<div v-if="sense.definitions.length > 0" class="space-y-2">
												<p class="text-sm font-semibold">Definitions</p>
												<div
													v-for="definition in sense.definitions"
													:key="`${sense.id}-${definition.lang}-${definition.text}`"
													class="flex flex-wrap items-center gap-2"
													:class="{ 'text-muted-foreground': definition.isMissing }"
												>
													<Badge v-if="definition.lang" variant="outline">
														{{ definition.lang }}
													</Badge>
													<span>{{ definition.text }}</span>
												</div>
											</div>
											<div v-if="sense.translations.length > 0" class="space-y-2">
												<div
													v-for="translation in sense.translations"
													:key="`${sense.id}-${translation.lang}-${translation.text}`"
													class="flex flex-wrap items-center gap-2"
													:class="{ 'text-muted-foreground': translation.isMissing }"
												>
													<Badge v-if="translation.lang" variant="outline">
														{{ translation.lang }}
													</Badge>
													<span>
														{{ translation.text }}
														<span v-if="translation.gloss">({{ translation.gloss }})</span>
													</span>
												</div>
											</div>
											<div v-if="sense.grammar.length > 0" class="space-y-1.5">
												<div
													v-for="item in sense.grammar"
													:key="`${sense.id}-${item.label}`"
													class="flex items-start gap-4"
												>
													<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
														{{ item.label }}
													</div>
													<div class="min-w-0 flex-1 text-sm font-normal">
														{{ item.value }}
													</div>
												</div>
											</div>
											<div v-if="sense.examples.length > 0" class="space-y-3">
												<p class="text-sm font-semibold">Examples</p>
												<button
													v-if="!isExpanded"
													class="rounded-sm border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
													type="button"
													@click="expandEntry"
												>
													{{ formatAvailableCount(sense.examples.length, "Example") }}
												</button>
												<Card
													v-for="example in isExpanded ? sense.examples : []"
													:key="`${example.kind}-${example.id ?? example.quote?.text}`"
													class="rounded-sm border border-primary/25 bg-muted/20 shadow-none"
												>
													<CardContent class="space-y-2 pt-4">
														<div
															v-if="example.locations.length > 0"
															class="flex flex-wrap justify-end gap-2"
														>
															<Badge
																v-for="location in example.locations"
																:key="formatLocation(location)"
																class="inline-flex items-center gap-1"
																variant="outline"
															>
																<MapPin class="size-3" />
																{{ formatLocation(location) }}
															</Badge>
														</div>
														<div v-if="example.quote" class="grid grid-cols-[3rem_1fr] gap-2">
															<div>
																<Badge v-if="example.quote.lang" variant="outline">
																	{{ example.quote.lang }}
																</Badge>
															</div>
															<span>{{ example.quote.text }}</span>
														</div>
														<div v-if="example.translations.length > 0" class="space-y-1">
															<div
																v-for="translation in example.translations"
																:key="`${example.id}-${translation.lang}-${translation.text}`"
																class="grid grid-cols-[3rem_1fr] gap-2"
																:class="{ 'text-muted-foreground': translation.isMissing }"
															>
																<div>
																	<Badge v-if="translation.lang" variant="outline">
																		{{ translation.lang }}
																	</Badge>
																</div>
																<span>{{ translation.text }}</span>
															</div>
														</div>
														<div v-if="example.bibliography.length > 0" class="space-y-1">
															<p class="text-sm font-semibold">Bibliography</p>
															<div class="flex flex-wrap gap-2">
																<Badge
																	v-for="item in example.bibliography"
																	:key="item"
																	variant="outline"
																>
																	{{ item }}
																</Badge>
															</div>
														</div>
														<div v-if="example.editors.length > 0" class="space-y-1">
															<div
																v-for="(editor, exampleEditorIndex) in example.editors"
																:key="`${example.id}-${editor.action}-${editor.when}-${exampleEditorIndex}`"
																class="flex flex-wrap items-center gap-2 text-sm"
															>
																<span>{{ editor.who ?? "Unknown" }}</span>
																<span>({{ editor.action }})</span>
																<span v-if="editor.when">{{ editor.when }}</span>
															</div>
														</div>
													</CardContent>
												</Card>
											</div>
										</CardContent>
									</Card>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.notes.length > 0">
							<TableCell :class="sectionHeadingClass">Notes</TableCell>
							<TableCell>
								<button
									v-if="!isExpanded"
									class="rounded-sm border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
									type="button"
									@click="expandEntry"
								>
									{{ formatAvailableCount(e.notes.length, "Note") }}
								</button>
								<div v-else class="space-y-2">
									<p v-for="note in e.notes" :key="note" class="m-0">
										{{ note }}
									</p>
								</div>
							</TableCell>
						</TableRow>
						<TableRow v-if="e.editors.length > 0">
							<TableCell :class="sectionHeadingClass">Editors</TableCell>
							<TableCell>
								<button
									v-if="!isExpanded"
									class="rounded-sm border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
									type="button"
									@click="expandEntry"
								>
									{{ formatAvailableCount(e.editors.length, "Editor") }}
								</button>
								<div v-else class="space-y-2">
									<div
										v-for="(editor, editorIndex) in e.editors"
										:key="`${editor.action}-${editor.when}-${editor.who}-${editorIndex}`"
										class="flex flex-wrap items-center gap-2"
									>
										<span class="font-medium">{{ editor.who ?? "Unknown" }}</span>
										<span>({{ editor.action }})</span>
										<span v-if="editor.when">{{ editor.when }}</span>
										<Badge v-if="editor.status" variant="outline">
											{{ editor.status }}
										</Badge>
									</div>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	</div>
</template>
