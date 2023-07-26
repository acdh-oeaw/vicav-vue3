<script setup lang="ts">
const { $api } = useNuxtApp();

const props = defineProps<{
  params: Record<any, any>;
}>();

const utterances = ref([])

async function created() {
  console.log(this.params.textId)
  const text = await this.$api.corpusText.getCorpusText(
      {id: this.params.textId},
      { headers: { 'Accept': 'application/json' }})
  this.utterances = text.data.utterances
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
