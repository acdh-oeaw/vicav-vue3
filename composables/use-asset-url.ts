import { createUrl } from "@acdh-oeaw/lib";

export function useAssetUrl(pathname: Ref<string | undefined>, fallback: string): Ref<string> {
	const env = useRuntimeConfig();

	const url = computed(() => {
		if (pathname.value == null) return fallback;

		const url = createUrl({
			baseUrl: env.public.NUXT_PUBLIC_API_BASE_URL,
			pathname: `/vicav/${pathname.value}`,
		});

		return String(url);
	});

	return url;
}
