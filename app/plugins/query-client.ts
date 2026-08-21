import {
	dehydrate,
	type DehydratedState,
	hydrate,
	keepPreviousData,
	QueryCache,
	QueryClient,
	VueQueryPlugin,
	type VueQueryPluginOptions,
} from "@tanstack/vue-query";

export default defineNuxtPlugin((nuxt) => {
	const state = useState<DehydratedState | null>("vue-query");
	const toastsStore = useToastsStore();
	const { addToast } = toastsStore;

	const THREE_MIN = 3 * 60 * 1000;
	const FIFTEEN_MIN = 15 * 60 * 1000;

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				placeholderData: keepPreviousData,
				staleTime: FIFTEEN_MIN,
			},
		},
		queryCache: new QueryCache({
			onError(error) {
				// FIXME:
				const message =
					error instanceof Response
						? // @ts-expect-error Set by api client.
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							((error.error?.title as string | undefined) ?? error.statusText)
						: error.message;

				if (import.meta.client) {
					addToast({
						title: "Error",
						description: message,
						type: "foreground",
						variant: "negative",
					});
				} else {
					console.error(error);
				}
			},
		}),
	});

	const options: VueQueryPluginOptions = { queryClient };

	nuxt.vueApp.use(VueQueryPlugin, options);

	if (import.meta.server) {
		nuxt.hooks.hook("app:rendered", () => {
			const dehydrated = dehydrate(queryClient);

			// Normalize volatile timestamps before sending to client to up to three minutes in the past
			for (const query of dehydrated.queries) {
				query.state.dataUpdatedAt = Math.floor(query.state.dataUpdatedAt / THREE_MIN) * THREE_MIN;
				query.state.errorUpdatedAt = Math.floor(query.state.errorUpdatedAt / THREE_MIN) * THREE_MIN;
				query.dehydratedAt = Math.floor((query.dehydratedAt ?? 0) / THREE_MIN) * THREE_MIN;
			}
			state.value = dehydrated;
		});
	}

	if (import.meta.client) {
		nuxt.hooks.hook("app:created", () => {
			// The maximum caching friendly approach would be to set the times to 0 or NaN above and
			// restore them here to the current timestamp in the browser.
			hydrate(queryClient, state.value);
		});
	}
});
