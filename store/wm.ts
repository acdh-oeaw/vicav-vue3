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
			window.winBoxOptions.index = windowList.value.length > 0
				? Math.max(...windowList.value.map(w => parseInt(w.ref.index))) + 1
				: 1000
			windowList.value.push(window)
			ArrangeWindows()
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
			ArrangeWindows()
		}

		const Focus = (windowId: number) => {
			let window = windowList.value.find(w => w.id == windowId)
			if (window != null) {
				window.ref.focus()
			}
		}

		const isMobile = false // @TODO
		const ArrangeWindows = async () => {
			await nextTick()
			if (isMobile) {
				ArrangeAllMaximize()
			} else {
				ArrangeSmartTile()
			}
		}

		const ArrangeAllMaximize = () => {
			windowList.value.forEach((w, i) => {
				w.ref
					.resize(clientSizeWidth.value, clientSizeHeight.value)
					.move(0, topMargin.value)
			})
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

		const ArrangeSmartTile = () => {
			let N = windowList.value.length
			let floorSqrtN = Math.floor(Math.sqrt(N))
			let innerSquare = Math.pow(floorSqrtN, 2)
			let isExtraRow = (N - innerSquare > floorSqrtN)
			let extraColHeight = N - innerSquare - (isExtraRow ? floorSqrtN : 0)
			let upperBlockSize = (floorSqrtN + 1) * extraColHeight

			windowList.value.forEach((w, i) => {
				let colNum = (i > upperBlockSize - 1
					? (i - upperBlockSize) % floorSqrtN
					: i % (floorSqrtN + 1))
				let rowNum = (i > upperBlockSize - 1
					? extraColHeight + Math.floor((i - upperBlockSize) / floorSqrtN)
					: Math.floor(i / (floorSqrtN + 1)))
				let windowWidth = Math.floor(clientSizeWidth.value / (i > upperBlockSize - 1 ? floorSqrtN : floorSqrtN + 1))
				let windowHeight = Math.floor(clientSizeHeight.value / (isExtraRow ? floorSqrtN + 1 : floorSqrtN))
				w.ref
					.resize(windowWidth, windowHeight)
					.move(windowWidth * colNum, topMargin.value + windowHeight * rowNum)
			})
		}

		const ArrangeCascade = () => {
			let windowWidth = Math.floor(clientSizeWidth.value / 2)
			let windowHeight = Math.floor(clientSizeHeight.value / 2)

			let windowArray = [...windowList.value]
			windowArray.sort((a, b) => {
				return a.ref.index - b.ref.index
			})

			windowArray.forEach((w, i) => {
				let newX = i * 40 > clientSizeWidth.value - windowWidth ? clientSizeWidth.value - windowWidth : i * 40
				let newY = topMargin.value + (i * 40 > clientSizeHeight.value - windowHeight ? clientSizeHeight.value - windowHeight : i * 40)
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
			ArrangeSmartTile,
			ArrangeCascade,
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
