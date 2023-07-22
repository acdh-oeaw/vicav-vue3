<template>
	<div id="corpus-text">
		<h2>{{ textId }}</h2>
		<div v-for="u in utterances">
			<p class="corpus-utterance" :id="u.id" v-html="u.content"></p>
		</div>
	</div>
</template>

<script>
const { $api } = useNuxtApp();
export default {
	props: ["params"],
	data() {
		return {
			utterances: []
		};
	},
	async created() {
		console.log(this.params.textId)
		const text = await this.$api.corpusText.getCorpusText(
			{id: this.params.textId},
			{ headers: { 'Accept': 'application/json' }})
		this.utterances = text.data.utterances
	}
};
</script>

<style lang="scss" scoped>
#corpus-text {
	padding: 1rem;
}
</style>
