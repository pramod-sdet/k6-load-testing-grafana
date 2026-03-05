import { sleep, check, group } from 'k6';
import http from 'k6/http';

const BASE_URL = 'https://quickpizza.grafana.com';

const PASSWORD = '123456711';

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
    vus: 2,
    duration: '5s'
};

export default function () {

    let userRegistered = false;
    let userAuthenticated = false;
    let authToken= null;
    let USERNAME = `pramod${randomString(7)}1`;

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


}

