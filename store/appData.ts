import {defineStore} from 'pinia';

export const useAppDataStore = defineStore(
    'appData',
    () => {
		const appTitle = ref('VICAV engine – no project loaded')
		const appMenu = ref([] as IMenuNode[])
		const mapBarMenu = ref(
			[{"id": "subNavBiblGeoMarkers", "icon": "fa fa-map", "title": "Bibl. Locations"},
			{"id": "subNavBiblRegMarkers", "icon": "fa fa-map", "title": "Bibl. Regions"},
			{"id": "subNavDictGeoRegMarkers", "icon": "fa fa-map", "title": "Bibl. (Dictionaries)"},
			{"id": "subNavTextbookGeoRegMarkers", "icon": "fa fa-map", "title": "Bibl. (Textbooks)"},
			{"id": "subNavProfilesGeoRegMarkers", "icon": "fa fa-map", "title": "Profiles"},
			{"id": "subNavFeaturesGeoRegMarkers", "icon": "fa fa-map", "title": "Features"},
			{"id": "subNavSamplesGeoRegMarkers", "icon": "fa fa-map", "title": "Samples"},
			{"id": "subNavVicavDictMarkers", "icon": "fa fa-map", "title": "VICAV Dictionaries"}]  as IMapBarItem[]);


		const GetProjectData = async () => {
			const { $api } = useNuxtApp();
			$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
			try {
				let projectInfo = await $api.project.getProject({headers: { 'Accept': 'application/json' }});
				appTitle.value = projectInfo.data.projectConfig.title;
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

		const isMobileMenuOpen = ref(false);
		const isMobile = ref(false);

		return {
			appTitle,
			appMenu,
			mapBarMenu,
			isMobileMenuOpen,
			isMobile,
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

export interface IMapBarItem {
	id: string
	icon: string,
	title: string,
}
