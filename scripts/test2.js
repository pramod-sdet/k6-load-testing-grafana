import http from 'k6/http'
import { sleep } from 'k6';

export const options= {


    stages : [
        { duration: '4s', target: 2 }, // ramp-up to 2 Vusers over 4 seconds
        { duration: '5s', target: 5 },   // stay at 5 Vusers for 5 seconds
        { duration: '3s', target: 0 }    // ramp-down to 0 Vusers over 3 seconds
    ],

    thresholds: {
        'http_req_duration': ['p(95)<1000'],
        'http_req_failed': ['rate<0.5']


    }

}
export default function(){

http.get("https://quickpizza.grafana.com/");
}