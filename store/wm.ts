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
			clientSizeHeight.value = height - topMargin.value
			ArrangeWindows()
		}

		const windowMarginPx = ref(5) // must be in sync with css class .wb-vicav in WindowManager.vue
		const counter = ref(0)
		const windowList = ref([] as IWindow[])
		const newWindow = ref(null as INewWindow|null)

		const Open = (windowTypeId: string, windowTitle: string, params: Object|null) => {
			newWindow.value = { id: counter.value++, title: windowTitle, windowTypeId, params }
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

		const ArrangeAllMaximize = () => {
			windowList.value.forEach((w, i) => {
				w.ref
					.resize(clientSizeWidth.value - 2 * windowMarginPx.value, clientSizeHeight.value - 2 * windowMarginPx.value)
					.move(0, topMargin.value)
			})
		}

		const ArrangeNot = () => {
			windowList.value.forEach(w => w.ref.removeClass('no-min').removeClass('no-max').removeClass('no-full').removeClass('no-resize').removeClass('no-move'))
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
					.resize(windowWidth - 2 * windowMarginPx.value, windowHeight - 2 * windowMarginPx.value)
					.move(newX, newY)
					.addClass('no-min').addClass('no-max').addClass('no-full').addClass('no-resize').addClass('no-move')
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
					.resize(windowWidth - 2 * windowMarginPx.value, windowHeight - 2 * windowMarginPx.value)
					.move(windowWidth * colNum, topMargin.value + windowHeight * rowNum)
					.addClass('no-min').addClass('no-max').addClass('no-full').addClass('no-resize').addClass('no-move')
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
					.resize(windowWidth - 2 * windowMarginPx.value, windowHeight - 2 * windowMarginPx.value)
					.move(newX, newY)
					.addClass('no-min').addClass('no-max').addClass('no-full').addClass('no-resize').addClass('no-move')
			})
		}


		interface WindowArrangeMethod {
			id: number
			name: string
			method: () => void
		}
		const desktopArrangeMethods: Array<WindowArrangeMethod> = [{
			id: 0,
			name: "No arrangement",
			method: ArrangeNot,
		}, {
			id: 1,
			name: "Cascade",
			method: ArrangeCascade,
		}, {
			id: 2,
			name: "Tile",
			method: ArrangeTile,
		}, {
			id: 3,
			name: "Smart Tile",
			method: ArrangeSmartTile,
		}]

		const selectedDesktopArrangeMethodId = ref(3) // TODO: move magic number to settings

		const SelectDesktopArrangeMethod = (wam: WindowArrangeMethod) => {
			let index = desktopArrangeMethods.findIndex(m => m.id === wam.id)
			if (index >= 0) {
				selectedDesktopArrangeMethodId.value = wam.id
				desktopArrangeMethods[index].method()
			} else {
				console.warn('Warning: invalid window arrange method id requested:', wam.id)
			}
		}

		const isMobile = false // @TODO
		const ArrangeWindows = async () => {
			await nextTick()
			if (isMobile) {
				ArrangeAllMaximize()
			} else {
				desktopArrangeMethods.find(m => m.id === selectedDesktopArrangeMethodId.value)?.method()
			}
		}

		const SanitizeLinks = (domId: string) => {
			console.log('SanitizeLinks starts')
			document.querySelectorAll(`#${domId} a`)
			.forEach(a => {
				console.log("SanitizeLinks focuses at:", a)
				if (a instanceof HTMLAnchorElement) {
					let targetType = a.getAttribute('data-target-type') as string,
						textId = a.getAttribute('data-text-id') as string
					console.log("SanitizeLinks found this:", targetType, textId)
					a.addEventListener("click", e => {
						let windowTitle = e.target.innerText
						console.log(`You clicked a link, target-type: ${targetType}, text-id: ${textId}, reference text: ${windowTitle}`)
						if (targetType == 'external-link') {
							return
						}
						e.preventDefault()
						if (targetType == null || textId == null) {
							GetDbSnippet_YesThisIsDeprecatedAndWillBeRemovedASAP(a.href.split("\"")[1])
							return
						}
						Open(targetType.charAt(0).toUpperCase() + targetType.slice(1), windowTitle, { id: textId })
					}, false)
				}
			})
		}

		const GetDbSnippet_YesThisIsDeprecatedAndWillBeRemovedASAP = (params: string) => {
			let splitPoint = params.indexOf(":")
			let sHead = params.substring(0, splitPoint)
			let sTail = params.substring(splitPoint + 1)
			let sh = sTail.split("/")
			let snippetID = sh[0].trim()
			let secLabel = ""
			if (!!sh[1]) {
				secLabel = sh[1].trim()
				secLabel = secLabel.replace(/_/g, " ")
			}
			let sid = null;
			let dict = null;
			switch (sHead) {
				case "dictID":
					let st5 = sTail.split(",");
					sid = st5[0];
					dict = st5[1];
					Open ('DictEntry', sid + ': ' + dict, { dict, sid })
					console.log('getDBSnippet: dictID,', { dict, sid })
					break;
				case "text":
					Open('Text', secLabel, { id: snippetID })
					console.log('getDBSnippet: text,', secLabel, { id: snippetID })
					break;
				default:
					console.warn("getDBSnippet: sHead type unknown [" + sHead + "]")
					break;
			}
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

			desktopArrangeMethods,
			SelectDesktopArrangeMethod,
			selectedDesktopArrangeMethodId,

			SanitizeLinks,
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
	title: string,
	windowTypeId: string,
	params: Object|null,
}

export interface IWindowType {
	component: ConcreteComponent<{}, any, any, ComputedOptions, MethodOptions>,
}

export interface IWindow {
	id: number | null
	ref: any
	type: IWindowType
	winBoxOptions: any
	params: Object|null
}
