// Quick PayPal Credentials Test

const clientId = 'Af9nNiwdRTGIhxJkS-fRLAdMMiFW7RoozUcDthYnoVGkiRT4TbVnJ0UMHMkLYIDpuRHHpqZTummDQlW8';
const clientSecret = 'EBnLbqfuOh8ij7bkRn-_mHBZ66S47ry-ky0Zuf0RSQ27It15DAY6gDAmbZ22CR_pnn0g9G6LRMi70DQA';
const baseUrl = 'https://api-m.sandbox.paypal.com';

async function testPayPalAuth() {
    console.log('\n🔍 Testing PayPal Sandbox Credentials...\n');
    console.log('Client ID:', clientId.substring(0, 20) + '...');
    console.log('Base URL:', baseUrl);
    console.log('\n⏳ Requesting access token...\n');

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            const error = await response.text();
            console.log('❌ FAILED - Authentication Error:');
            console.log(error);
            console.log('\n📝 Solution: You need to create a NEW app in PayPal Developer Dashboard');
            console.log('Visit: https://developer.paypal.com/dashboard/applications/sandbox');
            return;
        }

        const data = await response.json();
        console.log('✅ SUCCESS! PayPal credentials are valid\n');
        console.log('Access Token:', data.access_token.substring(0, 30) + '...');
        console.log('Token Type:', data.token_type);
        console.log('Expires In:', data.expires_in, 'seconds');
        console.log('\n🎉 Your PayPal integration is ready to use!\n');

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testPayPalAuth();
