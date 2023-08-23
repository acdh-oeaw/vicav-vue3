<script setup lang="ts">
  import { useWMStore } from '~~/store/wm';
  const WMStore = useWMStore()
  const { $api } = useNuxtApp();

  const queryString = ref("");
  const resultHtml = ref("");
  const hits = ref([]);

  async function QueryButtonClicked(e)  {
    const result = await $api.corpus.searchCorpus(
        { query: queryString.value },
        { headers: { 'Accept': 'application/json' }})

    if (result.error) return false;
    hits.value = result.data.hits;
  }

  function openCorpusText(e) {
    WMStore.Open("CorpusText", {
      textId: e.currentTarget.dataset.doc,
      hits: e.currentTarget.dataset.hits,
      u: e.currentTarget.dataset.uid
    });
  }

</script>

<template>
  <div id="corpus-query" class="p-2">
    <form class="d-flex">
      <input
          class="form-control me-2"
          type="text"
          v-model="queryString"
          style="flex: 1;"
          placeholder="Search in corpus ..."
          aria-label="Search"
      />
      <button class="corpusQueryBtn" @click.prevent.stop="QueryButtonClicked" :disabled="queryString === ''">
        Query</button
      ><br />
    </form>
    <div class="results">
      <div v-if="hits.length > 0">CQL: [word="{{ queryString }}"]</div>
      <table>
        <tr v-for="hit in hits" class="hit flex">
          <td class="pe-3">
          <a href="#" @click.prevent="openCorpusText" :data-hits="hit.docHits" :data-doc="hit.doc" :data-uid="hit.u">
            <strong>{{ hit.u }}</strong>
          </a>
          </td>
          <td class="corpus-search-results" v-html="hit.content">
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style lang="scss">
#corpus-query {
	padding: 1rem;
}

</style>
