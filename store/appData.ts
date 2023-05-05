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
						name: m.title,
						submenu: m.item.map((item: { title: any; componentName: any; id: any; }) => {
							return {
								name: item.title,
								windowTypeId: item.componentName,
								params: {
									id: item.id,
								}
							} as IMenuItem
						}),
					} as IMenuSubmenu
				})
				return projectInfo;
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

type IMenuNode = IMenuItem | IMenuSubmenu | IMenuSeparator
export interface IMenuItem {
	name: string,
	windowTypeId: string,
	params: null|Object,
}
export interface IMenuSubmenu {
	name: string,
	submenu: IMenuNode,
}
export interface IMenuSeparator {
}
