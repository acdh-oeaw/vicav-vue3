import {defineStore} from 'pinia';

export const useAppDataStore = defineStore(
    'appData',
    () => {
		const appTitle = ref('VICAV engine – no project loaded')
		const appMenu = ref([] as IMenuItem[])

		const GetProjectData = async () => {
			const { $api } = useNuxtApp();
			$api.baseUrl = ('' + import.meta.env.VITE_APIBASEURL);
			try {
				let projectInfo = await $api.project.getProject({headers: { 'Accept': 'application/json' }});
				appTitle.value = projectInfo.data.projectConfig.title
				appMenu.value = projectInfo.data.projectConfig.menu.main
				return projectInfo;
			} catch (error) {
				console.error(error)
			}
		}

		GetProjectData()
		watch(appTitle, (newVal) => { console.log('appTitle changed to', newVal) })

		return {
			appTitle,
			appMenu
		}
	}
)

export interface IMenuItem {
	name: string,
	windowTypeId: string,
	params: null|Object,
}
