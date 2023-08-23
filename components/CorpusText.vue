<script setup lang="ts">
import InfiniteLoading from "v3-infinite-loading";
import "v3-infinite-loading/lib/style.css"; //required if you're not going to override default slots

const { $api } = useNuxtApp();

const props = defineProps<{
  params: Record<any, any>;
}>();

const utterances = ref([])
const utteranceElements = ref([])
const currentPage = ref(1)

const loadNextPage = async function() {
  let text;
  text = await $api.corpusText.getCorpusText(
    {
      id: props.params.textId,
      hits: props.params.hits,
      page: currentPage.value
    },
    { headers: { 'Accept': 'application/json' }}
  )
  utterances.value = utterances.value.concat(text.data.utterances)
  currentPage.value = currentPage.value + 1;
  return text;
}

const handleInfiniteScroll = async function($state) {
  try {
    const text = await loadNextPage();
    currentPage.value = currentPage.value + 1
    $state.loaded()
    if (text.data.utterances.length < 10) $state.complete()
  } catch(e) {
    $state.error(e)
  }
}

const getText = async function() {
  let text;
  do {
    try {
      text = await loadNextPage()
    } catch(e) { console.log(e); }
  } while (
    text.data.utterances.filter((u) => u.id == props.params.u).length === 0 &&
    text.data.utterances.length != 0
  )
}


onMounted(() => {
  getText().then(() => {
    const u = utteranceElements.value.find(u => u.id == props.params.u)
    u.scrollIntoView({ behavior: 'smooth' })
  })
})

</script>

<template>
  <div class="corpus-text" :id="params.textId">
    <h2>{{ params.textId }}</h2>
    <div
      v-for="u in utterances"
      ref="utteranceElements"
      class="corpus-utterance"
      :id="u.id"
      v-html="u.content" />
    <InfiniteLoading @infinite="handleInfiniteScroll"/>
  </div>
</template>

<style lang="scss">
.corpus-text {
  padding: 1rem;
}
.u {
  display: flex;
  .xmlId {
    font-weight: bold;
    padding: 0 20px;
    min-width: fit-content;
  }
  .speaker {
    font-weight: bold;
    padding: § 20px;
  }
  .content {
    .hit {
      font-weight: bold;
    }
  }
}
</style>
