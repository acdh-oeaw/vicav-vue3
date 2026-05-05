<script setup lang="ts">
import { ChevronsUpDownIcon } from "lucide-vue-next";

const _props = defineProps<{
	options: Array<{ value: string; label?: string }>;
	placeholderText?: string;
	searchPlaceholder?: string;
	nothingFound?: string;
}>();

const open = ref(false);
const value = ref("");

const emit = defineEmits(["select"]);

function onSelect(option: (typeof _props.options)[0]) {
	value.value = value.value === option.value ? "" : option.value;
	open.value = false;
	emit("select", option);
}
</script>

<template>
	<Popover v-model:open="open">
		<PopoverTrigger>
			<div class="flex items-center justify-between">
				<span class="text-sm">{{ placeholderText }}</span>
				<ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</div>
		</PopoverTrigger>
		<PopoverContent class="bg-white p-0">
			<Command>
				<CommandInput :placeholder="searchPlaceholder" />
				<CommandList>
					<CommandEmpty>{{ nothingFound }}</CommandEmpty>
					<CommandGroup>
						<CommandItem
							v-for="option in options"
							:key="option.value"
							:value="option.value"
							@select="() => onSelect(option)"
						>
							{{ option.label ?? option.value }}
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>
