// Add your API invoke URL below, configured in Module 3. 

// src/config.js

module.exports = {
    cognito: {
        userPoolId: 'eu-west-1_jVH32930O',             // ודא שאלו הערכים האמיתיים שלך מ-AWS Cognito
        userPoolClientId: '2tpp7cjnvohbspt0nd4d8ul55d', // אותו כנ"ל
        region: 'eu-west-1'
    },
    api: {
        invokeUrl: 'https://9k3dhaj1vb.execute-api.eu-west-1.amazonaws.com/prod'
    }
};


