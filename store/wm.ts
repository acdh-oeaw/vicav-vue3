import { ref, computed, nextTick } from 'vue';
import { defineStore } from 'pinia';

export const useWMStore = defineStore(
	'wm',
	() => {

		const windowList = ref([] as WindowHandle[])
		const newWindow = ref(null as NewWindow|null)

		const Open = (windowTypeId: string, params: Object|null) => {
			let windowType: WindowType|undefined = knownWindowTypes.find(t => t.id == windowTypeId)
			if (typeof windowType == 'undefined') {
				console.error('Invalid window type', windowTypeId)
				return false;
			}
			newWindow.value = { windowType, params }
			nextTick(() => {
				newWindow.value = null
			})
			console.log('opening', newWindow.value)
		}

		const knownWindowTypes = [
			{ id: 'map', componentName: 'WMap' },
			{ id: 'dict-query', componentName: 'DictQuery' },
		] as WindowType[]

		interface WindowHandle {
			id: number
			ref: null // TODO
		}

		interface WindowType {
			id: string
			componentName: string
		}

		interface NewWindow {
			windowType: WindowType
			params: Object|null
		}

		return {
			windowList,
			newWindow,
			Open,
		}
	},
	{
		logger: {
			actions: ["Open"],
		},
	}
)