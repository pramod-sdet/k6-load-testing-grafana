import http from 'k6/http'
import { sleep } from 'k6';

export const options= {

    vus: 3,
    duration : '10s',

    
    thresholds: {
        'http_req_duration': ['p(95)<1000'],
        'http_req_failed': ['rate<0.5']


    }

}
export default function(){

http.get("https://quickpizza.grafana.com/");
}