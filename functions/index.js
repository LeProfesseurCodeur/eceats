const functions = require('firebase-functions');

const hmac_sha256 = require('crypto-js/hmac-sha256');

const request = require('request');

const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

firebaseConfig.credential = admin.credential.cert(serviceAccount)

admin.initializeApp(firebaseConfig);


exports.getCustomToken = functions.https.onRequest((req,res) =>{
    const accessToken = req.query.access_token;
    const facebookAppSecret = '0e2189a7a9e8be6d6d8736e12fbda06c';
    const appSecretProof = hmac_sha256(accessToken,facebookAppSecret);


    request({
            url: `https://graph.accountkit.com/v1.1/me?access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
            json: true
        },
        (error,fbResponse,data) => {
    if(error) {
        console.log('Access token validation request failed\n',error);
        res.status(400).send(error);
    } else if(data.error) {
        console.error('Invalid access token\n',
            `access_token=${accessToken}`,
            `appsecret_proof=${appSecretProof}`
            ,data.error);
        res.status(400).send(data);
    }
    else {

        admin.auth().createCustomToken(data.id)
            .then(customToken => res.status(200).send(customToken))
            .catch(error => {
                console.error('Create custom token failed:',error);
                res.status(400).send(error);
            })
        }
    })
});
