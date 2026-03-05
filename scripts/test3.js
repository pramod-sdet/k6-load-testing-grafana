import http from 'k6/http'
import { sleep } from 'k6';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '4s', target: 2 }, // ramp-up to 2 Vusers over 4 seconds
        { duration: '5s', target: 5 },   // stay at 5 Vusers for 5 seconds
        { duration: '3s', target: 0 }    // ramp-down to 0 Vusers over 3 seconds
    ],

    thresholds: {
        'http_req_duration': ['p(95)<1000'],
        'http_req_failed': ['rate<0.5'],
        checks: ['rate>0.9'] // Ensure that at least 90% of checks pass
    }

}

export default function () {
    const response = http.get("https://quickpizza.grafana.com/");

    check(response, {

        'status is 200': (r) => r.status == 200,

        'page contains pizza': (r) => {
            r.body.includes("pizza")
        }
    })

    sleep(1)

}