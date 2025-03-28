<script setup lang="ts">
import {
	Church,
	Contact,
	ExternalLink,
	Info,
	Languages,
	type LucideIcon,
	Mars,
	UsersRound,
	Venus,
} from "lucide-vue-next";

const props = defineProps<{
	value?: Record<string, unknown>;
}>();

function getSources(featureValueEntry: unknown) {
	return (
		(featureValueEntry as Record<string, Record<string, Record<string, string>>>).sources ?? {}
	);
}
const iconMap: Record<string, Record<string, LucideIcon>> = {
	gender: {
		"#male": Mars,
		"pgr:male": Mars,
		"#female": Venus,
		"pgr:female": Venus,
	},
	firstLanguage: {
		"#default": Languages,
	},
	ageGroup: {
		"#default": Contact,
	},
	tribe: {
		"#default": UsersRound,
	},
	religion: {
		"#default": Church,
	},
};
function getPersonGroups(featureValueEntry: unknown) {
	const personGroups =
		(featureValueEntry as Record<string, Array<Record<string, string>>>).person_groups ?? [];
	return personGroups.toSorted(
		(a, b) =>
			(Object.keys(a)[0]?.localeCompare(Object.keys(b)[0] ?? "") ||
				Object.values(a)[0]?.localeCompare(Object.values(b)[0] ?? "")) ??
			0,
	);
}
function getPersonGroupIcon(personGroup: Record<string, string>) {
	for (const key in personGroup) {
		if (iconMap[key]) {
			if (iconMap[key][personGroup[key]!])
				return { icon: iconMap[key][personGroup[key]!], hideValue: true };
			else if (iconMap[key]["#default"])
				return { icon: iconMap[key]["#default"], hideValue: false };
		}
	}
	return null;
}
function trimPrefix(str: string) {
	return str.replace(/(#|pgr:)/, "");
}
const infoOpen = ref(Object.fromEntries(Object.keys(props.value ?? {}).map((key) => [key, false])));
</script>

<template>
	<div>
		<div v-for="(key, val) in props.value" :key="val" class="my-0.5 block">
			<div class="flex flex-wrap items-center gap-2">
				<span class="max-w-full flex-shrink-0 text-ellipsis">{{ val }}</span>

				<Collapsible
					v-if="getPersonGroups(key).length > 0"
					v-model:open="infoOpen[val]"
					class="flex gap-2"
				>
					<CollapsibleTrigger
						><Info class="size-4 stroke-neutral-400 transition-colors hover:stroke-neutral-700" />
						<span class="sr-only">Show info</span>
					</CollapsibleTrigger>
					<CollapsibleContent orientation="horizontal"
						><div class="inline-flex items-center gap-2 text-ellipsis">
							<template v-for="personGroup in getPersonGroups(key)">
								<Badge
									v-for="(personGroupVal, personGroupKey) in personGroup"
									:key="personGroupVal"
									class="line-clamp-1 gap-0.5"
									variant="outline"
								>
									<component
										:is="getPersonGroupIcon(personGroup)!.icon"
										v-if="getPersonGroupIcon(personGroup)"
										class="size-3"
									/>
									<span :class="{ 'sr-only': getPersonGroupIcon(personGroup) }"
										>{{ personGroupKey }}:
									</span>
									<span
										class="line-clamp-1"
										:class="{ 'sr-only': getPersonGroupIcon(personGroup)?.hideValue }"
										>{{ trimPrefix(personGroupVal) }}</span
									>
								</Badge>
							</template>
						</div></CollapsibleContent
					>
				</Collapsible>
				<NuxtLink
					v-for="source in getSources(key)"
					:key="source.link"
					class="text-primary"
					external
					target="_blank"
					:to="source.link"
				>
					<span class="sr-only">View Source</span><ExternalLink class="size-3.5" />
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
