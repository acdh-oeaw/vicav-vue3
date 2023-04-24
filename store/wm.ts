import { ref, nextTick, ConcreteComponent, ComputedOptions, MethodOptions, resolveComponent } from 'vue';
import { defineStore } from 'pinia';

export const useWMStore = defineStore(
	'wm',
	() => {

		const windowList = ref([] as IWindow[])
		const newWindow = ref(null as INewWindow|null)

		const Open = (windowTypeId: string, params: Object|null) => {
			newWindow.value = { windowTypeId, params }
			nextTick(() => {
				newWindow.value = null
			})
			console.log('opening', newWindow.value)
		}

		const AddWindowToList = (window: IWindow) => {
			windowList.value.push(window)
		}

		return {
			windowList,
			newWindow,
			Open,
			AddWindowToList,
		}
	},
	{
		logger: {
			actions: ["Open"],
		},
	}
)

export interface INewWindow {
	windowTypeId: string,
	params: Object|null,
}

export interface IWindowType {
	title: string,
	component: ConcreteComponent<{}, any, any, ComputedOptions, MethodOptions>,
}

export interface IWindow {
	id: number | null
	ref: any
	type: IWindowType
	winBoxOptions: any
}

export const windowTypes = {
	WMap: {
		title: 'Map',
		component: resolveComponent('WMap'),
	} as IWindowType,
	DictQuery: {
		title: 'Dictionary query',
		component: resolveComponent('DictQuery'),
	} as IWindowType,
}
