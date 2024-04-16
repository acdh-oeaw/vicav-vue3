<script lang="ts" setup>
import type { DataListWindowItem } from "@/types/global.d";

interface Props {
	params: DataListWindowItem["params"];
}

interface teiHeader {
	"@id": string;
	teiHeader: { fileDesc: { titleStmt: { title: { $: string } } } };
}

interface TEIs {
	"@id": string;
	TEIs: Array<teiHeader>;
}

const props = defineProps<Props>();
const { data: projectData } = useProjectInfo();

const items: ComputedRef<Array<TEIs>> = computed(() => {
	return projectData.value?.projectConfig?.staticData?.table?.filter(
		(v) => v["@id"] === props.params.textId,
	) as Array<TEIs>;
});
</script>

<template>
	<div class="relative isolate grid h-full w-full overflow-auto">
		<ul>
			<li v-for="item in items[0]?.TEIs" :key="item['@id']">
				{{ item.teiHeader.fileDesc.titleStmt.title.$ }}
			</li>
		</ul>
	</div>
</template>
