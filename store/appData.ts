import {defineStore} from 'pinia';

export const useAppDataStore = defineStore(
    'appData',
    () => {
		const appTitle = ref('VICAV engine – no project loaded')
		const appMenu = ref([] as IMenuNode[])

		const GetProjectData = async () => {
			const { $api } = useNuxtApp();
			$api.baseUrl = ('' + import.meta.env.VITE_APIBASEURL);
			try {
				let projectInfo = await $api.project.getProject({headers: { 'Accept': 'application/json' }});
				appTitle.value = projectInfo.data.projectConfig.title
				appMenu.value = projectInfo.data.projectConfig.menu.main.map(m => {
					return {
						id: m.id,
						type: 'submenu',
						name: m.title,
						submenu: m.item.map((item: { id: string; type: string; title: string; componentName: string; }) => {
							switch (item.type) {
								case 'item':
									return {
										id: item.id,
										type: 'item',
										name: item.title,
										windowTypeId: item.componentName,
										params: {
											id: item.id,
										}
									} as IMenuItem
								case 'separator':
									return {
										type: 'separator',
									} as IMenuSeparator
								case 'dropdown':
									return {
										id: item.id,
										type: 'submenu',
										name: item.title
									} as IMenuSubmenu
							}
						}),
					} as IMenuSubmenu
				})
			} catch (error) {
				console.error(error)
			}
		}

		GetProjectData()

		return {
			appTitle,
			appMenu
		}
	}
)

export type IMenuNode = IMenuItem | IMenuSubmenu | IMenuSeparator
export interface IMenuItem {
	type: 'item',
	id: string,
	name: string,
	windowTypeId: string,
	params: null|Object,
}
export interface IMenuSubmenu {
	type: 'submenu',
	id: string,
	name: string,
	submenu: IMenuNode[],
}
export interface IMenuSeparator {
	type: 'separator',
}
