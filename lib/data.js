import axios from 'axios'

export function getEntity(type, caption_, snippetID_) {
    return new Promise((resolve, reject) => {
        let collection = (type == 'feature') ? 'vicav_lingfeatures' : `vicav_${type}s`

        let style = null
        switch (type){
            case 'feature':
                style='features_01.xslt'
                break;
            case 'sample':
                style='sampletext_01.xslt'
                break;

            case 'profile':
                style='profile_01.xslt'
                break;       
        }

        let qs = `/profile?coll=${collection}&id=${snippetID_}&xslt=${style}`;

        return axios.request({
            baseURL: 'http://' + import.meta.env.VITE_BASEURL,
            url: qs,
            type: 'GET'
        }).then((response) => {
            resolve(response.data)
        }).catch(err => {
            reject(err);
        })
    })
}