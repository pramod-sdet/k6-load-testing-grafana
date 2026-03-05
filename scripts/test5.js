import http from 'k6/http'
import { sleep } from 'k6';
import { check } from 'k6';
import { Trend } from 'k6/metrics'

const apiResponseTime = new Trend('pizza_response_time')
const apiRequestTime = new Trend('request_time')
export const options = {

    stages: [
        { duration: '4s', target: 2 }, // ramp-up to 2 Vusers over 4 seconds
        { duration: '5s', target: 5 },   // stay at 5 Vusers for 5 seconds
        { duration: '3s', target: 0 }    // ramp-down to 0 Vusers over 3 seconds
    ],

    thresholds: {
        'http_req_duration': ['p(95)<1000'],
        'http_req_failed': ['rate<0.5'],
        'checks': ['rate>0.9'],// Ensure that at least 90% of checks pass
        'http_req_failed{name:api}': ['rate<0.1'],
        'pizza_response_time': ['p(95)<200'] ,// Custom threshold for pizza API response time
        'request_time': ['p(95)<200'] // Custom threshold for request time
    }

}

export default function () {

    // Homepage request
    const response = http.get("https://quickpizza.grafana.com/");

    check(response, {
        'status is 200': (r) => r.status === 200,
        'page contains pizza': (r) => r.body.includes("pizza")
    });

    // Pizza API request
    const apiResponse = http.get("https://quickpizza.grafana.com/api/pizza", {
        tags: { name: 'api' }
    });

    // Track only API waiting time
    apiResponseTime.add(apiResponse.timings.waiting);
    apiRequestTime.add(apiResponse.timings.sending);

    sleep(1);
}