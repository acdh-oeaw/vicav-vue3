declare module "vue-material-design-icons/*" {
	import type { DefineComponent } from "vue";

	const component: DefineComponent<{
		/// `size` defaults to 24
		size?: number;
		/// `fillColor` defaults to 'currentColor'
		fillColor?: string;
		title?: string;
	}>;
	export default component;
}
