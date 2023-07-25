import { ref, nextTick, ConcreteComponent, ComputedOptions, MethodOptions } from 'vue';
import { defineStore } from 'pinia';

export const useWMStore = defineStore(
	'wm',
	() => {
		const topMargin = ref(0)
		const SetTopMargin = (heightInPixels: number) => {
			topMargin.value = heightInPixels
		}
		const clientSizeWidth = ref(0)
		const clientSizeHeight = ref(0)
		const RegisterClientSize = (width: number, height: number) => {
			clientSizeWidth.value = width
			clientSizeHeight.value = height
		}

		const counter = ref(0)
		const windowList = ref([] as IWindow[])
		const newWindow = ref(null as INewWindow|null)

		const Open = (windowTypeId: string, params: Object|null) => {
			newWindow.value = { id: counter.value++, windowTypeId, params }
			nextTick(() => {
				newWindow.value = null
			})
		}

		const AddWindowToList = (window: IWindow) => {
			windowList.value.push(window)
		}

		const RegisterWindowRef = (i: number, ref: HTMLElement) => {
			windowList.value[i].ref = ref
		}

		const RemoveWindowRef = (i: number, ref: any) => {
			let index = windowList.value.findIndex(w => w.ref.id === ref.id);
			if(index >= 0) {
				ref.g.remove();
				windowList.value.splice(index, 1);
			}
		}

		const Focus = (windowId: number) => {
			let window = windowList.value.find(w => w.id == windowId)
			if (window != null) {
				window.ref.focus()
			}
		}

		const ArrangeTile = () => {
			let cols = Math.floor(Math.sqrt(windowList.value.length - 1)) + 1
			let rows = Math.ceil(windowList.value.length / cols)
			let windowWidth = Math.floor(clientSizeWidth.value / cols)
			let windowHeight = Math.floor(clientSizeHeight.value / rows)

			windowList.value.forEach((w, i) => {
				let newX = windowWidth * (i % cols),
					newY = topMargin.value + windowHeight * Math.floor(i / cols)
				w.ref
					.resize(windowWidth, windowHeight)
					.move(newX, newY)
			})
		}

		return {
			topMargin,
			SetTopMargin,
			RegisterClientSize,

			windowList,
			newWindow,
			Open,
			AddWindowToList,
			RegisterWindowRef,
			RemoveWindowRef,
			Focus,

			ArrangeTile,
		}
	},
	{
		logger: {
			actions: ["Open"],
		},
	}
)

export interface INewWindow {
	id: number,
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
	params: Object|null
}
