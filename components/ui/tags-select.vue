<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
	ComboboxAnchor,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxItemIndicator,
	ComboboxRoot,
	ComboboxViewport,
	TagsInputInput,
	TagsInputItem,
	TagsInputItemDelete,
	TagsInputItemText,
	TagsInputRoot,
} from "radix-vue";

interface Tag {
	label: string;
	value: string;
	heading: boolean;
}

interface Props {
	options: Array<Tag>;
	placeholder: string;
}

const props = defineProps<Props>();
const { options, placeholder } = toRefs(props);
const searchTerm = ref("");
const model = defineModel<Array<string>>();
const open = ref(false);

watch(
	model,
	() => {
		searchTerm.value = "";
		open.value = false;
	},
	{ deep: true },
);
</script>

<template>
	<ComboboxRoot
		v-model="model"
		v-model:search-term="searchTerm"
		v-model:open="open"
		multiple
		class="mx-auto w-full"
	>
		<ComboboxAnchor class="w-full">
			<TagsInputRoot
				v-slot="{ modelValue: tags }"
				:model-value="model"
				delimiter=""
				class="my-2 flex w-full flex-wrap items-center gap-2 border-gray-300 bg-white px-3 py-2 shadow"
			>
				<TagsInputItem
					v-for="item in tags"
					:key="item"
					:value="item"
					class="flex items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-white aria-[current=true]:bg-primary"
				>
					<TagsInputItemText class="text-sm">
						{{ options.find((opt) => opt.value === item).label }}
					</TagsInputItemText>
					<TagsInputItemDelete>
						<Icon icon="lucide:x" />
					</TagsInputItemDelete>
				</TagsInputItem>

				<ComboboxInput as-child>
					<TagsInputInput
						:placeholder="placeholder"
						class="flex flex-1 flex-wrap items-center gap-2 rounded !bg-transparent px-1 focus:outline-none"
						@keydown.enter.prevent
					/>
				</ComboboxInput>
			</TagsInputRoot>
		</ComboboxAnchor>
		<ComboboxContent
			class="z-10 mt-2 w-full overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
		>
			<ComboboxViewport class="p-[5px]">
				<ComboboxEmpty class="py-2 text-center text-xs font-medium text-gray-400" />

				<ComboboxGroup>
					<ComboboxItem
						v-for="(option, index) in options"
						:key="index"
						class="relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none data-[disabled]:pointer-events-none data-[highlighted]:bg-secondary data-[disabled]:text-gray-300 data-[highlighted]:outline-none"
						:value="option.value"
					>
						<ComboboxItemIndicator
							class="absolute left-0 inline-flex w-[25px] items-center justify-center"
						>
							<Icon icon="radix-icons:check" />
						</ComboboxItemIndicator>

						<strong v-if="option.heading">
							{{ option.label }}
						</strong>
						<span v-else>
							{{ option.label }}
						</span>
					</ComboboxItem>
				</ComboboxGroup>
			</ComboboxViewport>
		</ComboboxContent>
	</ComboboxRoot>
</template>
