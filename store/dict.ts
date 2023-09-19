import {defineStore} from 'pinia';

export const useDictStore = defineStore(
    'dict',
    () => {
        const dictList = [
            {
                id: "cbCairo",
                name: "Cairo",
                long_name: "Cairo Dictionary",
                coll_name: "dc_arz_eng_publ",
                query_selector: "ar-arz-x-cairo-vicav",
                xslt: "cairo_dict_001.xslt",
            },
            {
                id: "cbDamascus",
                name: "Damascus",
                long_name: "Damascus Dictionary",
                coll_name: "dc_apc_eng_publ",
                query_selector: "ar-apc-x-damascus-vicav",
                xslt: "damascus_dict_001.xslt",
            },
            {
                id: "cbTunis",
                name: "Tunis",
                long_name: "TUNICO Dictionary",
                coll_name: "dc_tunico",
                query_selector: "ar-aeb",
                xslt: "tunis_dict_001.xslt",
            },
            {
                id: "cbBaghdad",
                name: "Baghdad",
                long_name: "Baghdad Dictionary",
                coll_name: "dc_acm_baghdad_eng_publ",
                query_selector: "ar-acm-x-baghdad-vicav",
                xslt: "baghdad_dict_001.xslt",
            },
            {
                id: "cbMsa",
                name: "MSA",
                long_name: "MSA Dictionary",
                coll_name: "dc_ar_en_publ",
                query_selector: "ar-x-DMG",
                xslt: "fusha_dict_001.xslt",
            },
        ] as Array<IDictionary>

        const dictCrossQueryXslt = "dicts_cross_query_001.xslt"

        return {
            dictList,
            dictCrossQueryXslt,
        }
    }
)

export interface IDictionary {
    id:             string, // "cbCairo"                checkbox Id used in search form
    name:           string, // "Cairo"                  label used in search form
    long_name:      string, // "Cairo Dictionary"       long name
    coll_name:      string, // "dc_arz_eng_publ"        dictionary id used in search query (comma separated)
    query_selector: string, // "ar-arz-x-cairo-vicav"   dictionary id used in GetDbSnippetParams
    xslt:           string, // "cairo_dict_001.xslt"    xslt parameter sent to backend in search query
}
