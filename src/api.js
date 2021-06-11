const fetch = require('node-fetch');

const host = 'http://api.exchangeratesapi.io';
// This could even better come from a share secrets artifact.
const key = process.env.RATE_API_SECRET;

module.exports = {
    endpoint: {
        symbols: () => `${host}/v1/symbols?access_key=${key}`,
        rates: (base, symbols = []) => `${host}/v1/latest?access_key=${key}&base=${base}&symbols=${symbols.join()}`
    },
    fetch: async (endpoint, ...params) => {
        const url = endpoint(...params);
        return await fetch(url).then((response) => response.json());
    }
};

