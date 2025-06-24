<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { CheckboxIndicator, CheckboxRoot } from "radix-vue";

const male = ref(true);
const female = ref(true);

const model = defineModel("modelValue", { type: Array, default: [] });

watch(model.value, (value) => {
	if ("m" in value) {
		male.value = true;
	}
	if ("f" in value) {
		female.value = true;
	}
});

const filterUpdated = function () {
	if (male.value && female.value) {
		model.value = ["m", "f"];
	} else if (male.value) {
		model.value = ["m"];
	} else if (female.value) {
		model.value = ["f"];
	} else {
		model.value = [];
	}
};
</script>

<template>
	<div class="flex flex-row gap-2">
		<label
			class="flex w-20 flex-row items-center gap-4 p-0 hover:[&>.checkbox]:bg-neutral-100"
			for="sex-male"
		>
			<CheckboxRoot
				v-model:checked="male"
				class="flex size-[20px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_2px] shadow-gray-300 outline-hidden focus-within:shadow-[0_0_0_2px_gray]"
				if="sex-male"
				@update:checked="filterUpdated"
			>
				<CheckboxIndicator class="flex size-full items-center justify-center rounded bg-white">
					<Icon class="size-3.5" icon="radix-icons:check" />
				</CheckboxIndicator>
			</CheckboxRoot>
			<span class="select-none">Male</span>
		</label>
		<label
			class="flex flex-row items-center gap-4 p-0 hover:[&>.checkbox]:bg-neutral-100"
			for="sex-female"
		>
			<CheckboxRoot
				id="sex-female"
				v-model:checked="female"
				class="flex size-[20px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_2px] shadow-gray-300 outline-hidden focus-within:shadow-[0_0_0_2px_gray] hover:bg-white"
				@update:checked="filterUpdated"
			>
				<CheckboxIndicator class="flex size-full items-center justify-center rounded bg-white">
					<Icon class="size-3.5" icon="radix-icons:check" />
				</CheckboxIndicator>
			</CheckboxRoot>
			<span class="select-none">Female</span>
		</label>
	</div>
</template>
