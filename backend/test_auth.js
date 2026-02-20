const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    try {
        console.log('--- Testing Registration ---');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123'
        });
        console.log('Registration Success:', regRes.data.message);

        const email = regRes.data.user.email;

        console.log('\n--- Testing Login ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data.message);
        console.log('Token Received:', !!loginRes.data.token);

    } catch (error) {
        console.error('Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAuth();
