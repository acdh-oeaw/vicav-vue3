<script setup lang="ts">
const { $api } = useNuxtApp();

const props = defineProps<{
  params: Record<any, any>;
}>();

const utterances = ref([])

async function created() {
  console.log(props.params.textId)
  const text = await $api.corpusText.getCorpusText(
      {id: props.params.textId},
      { headers: { 'Accept': 'application/json' }})
  utterances.value = text.data.utterances
}
</script>

<template>
  <div id="corpus-text">
    <h2>{{ params.textId }}</h2>
    <div v-for="u in utterances">
      <p class="corpus-utterance" :id="u.id" v-html="u.content"></p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#corpus-text {
	padding: 1rem;
}
</style>
