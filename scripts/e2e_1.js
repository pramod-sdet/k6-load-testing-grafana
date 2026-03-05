import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = 'https://quickpizza.grafana.com';
const PASSWORD = '123456711';
const authenticationRate = new Rate('authentication_rate');
const successfulOrders = new Counter('successfulOrders');

function randomString(length) {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
export const options = {

    cloud: {
        // Project: Default project
        projectID: 6888472,
        distribution: {
            'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
        },
        // Test runs with the same name groups test runs together.
        name: 'Test e2e',
    },

    stages: [
        { duration: '5s', target: 2 },
        { duration: '5s', target: 4 },
        { duration: '3s', target: 0 },
    ],

    thresholds: {

        'http_req_duration': ['p(95)<450'],
        'checks': ['rate>0.90'],
        'iteration_duration': ['p(95)<8000'],
        'group_duration{group:::Order Management}': ['p(95)<2000'],
        'successfulOrders': ['count>5']
    }

};

export default function () {

    let userRegistered = false;
    let userAuthenticated = false;
    let authToken = null;
    let USERNAME = `pramod${randomString(7)}1`;
    let orderCreated = false;
    let orderId = null;;
    let orderRetrieved = false;

    group('User Registration', function () {

        const registerPayLoad = {
            username: USERNAME,
            password: PASSWORD
        };

        const params = {
            headers: { 'Content-Type': 'application/json' }
        };

        const regresponse = http.post(
            `${BASE_URL}/api/users`,
            JSON.stringify(registerPayLoad),
            params
        );

        userRegistered = check(regresponse, {
            'response code is 201': (r) => r.status === 201
        });

        if (!userRegistered) {
            console.error(`User registration failed ${regresponse.status} - ${regresponse.body}`);
        }

        sleep(1);

    });

    group('login', function () {
        const registerPayLoad = {
            username: USERNAME,
            password: PASSWORD
        };

        const loginResponse = http.post(`${BASE_URL}/api/users/token/login`, JSON.stringify(registerPayLoad),
            { headers: { 'Content-Type': 'application/json' } });


        userAuthenticated = check(loginResponse, {

            'login status is 200': (r) => r.status === 200,
            'verify if the login reposne contains token': (r) => r.json('token') !== undefined,
            'token is a valid string': (r) => r.json('token').length > 4
        })
        if (userAuthenticated) {
            authToken = loginResponse.json('token');
            console.log(`User is authenticated sucessfully: ${USERNAME}`)
        }
        else {

            console.error(`User authentication failed ${loginResponse.status} - ${loginResponse.body}`);
        }
    });

    group('Order Management', function () {

        const params = {

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            }
        };
        const orderPayLoad = {

            "maxCaloriesPerSlice": 1000,
            "mustBeVegetarian": true,
            "excludedIngredients": [],
            "excludedTools": [
                "Pizza cutter"
            ],
            "maxNumberOfToppings": 9,
            "minNumberOfToppings": 2,
            "customName": "hello1"
        }
        const orderResponse = http.post(`${BASE_URL}/api/pizza`, JSON.stringify(orderPayLoad), params);

        orderCreated = check(orderResponse, {

            'order creation status is 200': (r) => r.status === 200,
            'order contains id': (r) => r.json('pizza.id') !== undefined,
            'order name matches': (r) => r.json('pizza.name') === orderPayLoad.customName
        })

        if (orderCreated) {
            successfulOrders.add(1);
            orderId = orderResponse.json('pizza.id');
            console.log(`Order is successfully created: ${orderId}`)
        } else {

            console.error(`Order creation failed ${orderResponse.status} - ${orderResponse.body}`);
            return
        }
        sleep(0.5);

        //Retrive the order 

        const retrieveOrderResponse = http.get(`${BASE_URL}/api/pizza/${orderId}`, params);

        orderRetrieved = check(retrieveOrderResponse, {

            'order creation status is 200': (r) => r.status === 200,
            'order contains id': (r) => r.json('id') === orderId,
            'order name matches': (r) => r.json('name') === orderPayLoad.customName
        })

        if (orderRetrieved) {

            console.log(`OrderId retrieved successfully : ${orderId}`)
        }
    })

}

