import { ref, nextTick } from 'vue';
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
	id: string
	title: string,
	componentName: string,
}

export interface IWindow {
	id: number | null
	ref: any
	type: IWindowType
	winBoxOptions: any
}
