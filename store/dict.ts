import {defineStore} from 'pinia';

export const useDictStore = defineStore(
    'dict',
    () => {
        // A dictionary data object must have the following properties:
        //   id: "cbCairo",
        //   name: "Cairo",
        //   long_name: "Cairo Dictionary",
        //   selected: false,
        //   coll_name: "dc_arz_eng_publ",
        //   query_selector: "ar-arz-x-cairo-vicav",
        //   xslt: "cairo_dict_001.xslt",
        const dictList = [
            {
                id: "cbCairo",
                name: "Cairo",
                long_name: "Cairo Dictionary",
                selected: false,
                coll_name: "dc_arz_eng_publ",
                query_selector: "ar-arz-x-cairo-vicav",
                xslt: "cairo_dict_001.xslt",
            },
            {
                id: "cbDamascus",
                name: "Damascus",
                long_name: "Damascus Dictionary",
                selected: false,
                coll_name: "dc_apc_eng_publ",
                query_selector: "ar-apc-x-damascus-vicav",
                xslt: "damascus_dict_001.xslt",
            },
            {
                id: "cbTunis",
                name: "Tunis",
                long_name: "TUNICO Dictionary",
                selected: true,
                coll_name: "dc_tunico",
                query_selector: "ar-aeb",
                xslt: "tunis_dict_001.xslt",
            },
            {
                id: "cbBaghdad",
                name: "Baghdad",
                long_name: "Baghdad Dictionary",
                selected: true,
                coll_name: "dc_acm_baghdad_eng_publ",
                query_selector: "ar-acm-x-baghdad-vicav",
                xslt: "baghdad_dict_001.xslt",
            },
            {
                id: "cbMsa",
                name: "MSA",
                long_name: "MSA Dictionary",
                selected: false,
                coll_name: "dc_ar_en_publ",
                query_selector: "ar-x-DMG",
                xslt: "fusha_dict_001.xslt",
            },
        ]

        const dictCrossQueryXslt = "dicts_cross_query_001.xslt"

        return {
            dictList,
            dictCrossQueryXslt,
        }
    }
)
