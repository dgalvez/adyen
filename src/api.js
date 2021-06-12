const fetch = require('node-fetch');

const host = 'http://api.exchangeratesapi.io';
// This could even better come from a share secrets artifact.
const key = process.env.RATE_API_SECRET;
const currencyRestrictedErrorCode = 'base_currency_access_restricted';

const api = {
    endpoint: {
        symbols: () => `${host}/v1/symbols?access_key=${key}`,
        rates: (base, symbols = []) => `${host}/v1/latest?access_key=${key}&base=${base}&symbols=${symbols.join()}`
    },
    fetch: async (endpoint, ...params) => {
        const url = endpoint(...params);
        return await fetch(url).then((response) => response.json());
    },
    getConversionRate: async (sourceCurrency, targetCurrency) => {
        if (sourceCurrency === targetCurrency) {
            return 1.0;
        }

        let rateCorrector = (rate) => rate;
        let rateAccesor = (rates) => rates[targetCurrency];
        let response = await api.fetch(api.endpoint.rates, sourceCurrency, [targetCurrency]);

        if (getErrorCode(response) === currencyRestrictedErrorCode) {
            rateCorrector = (rate) => 1 / rate;
            rateAccesor = (rates) => rates[sourceCurrency];
            response = await api.fetch(api.endpoint.rates, targetCurrency, [sourceCurrency]);
        }

        const { rates, error } = response || {};
        if (!rates || error) {
            return undefined;
        }

        return parseFloat(rateCorrector(rateAccesor(rates)));
    }
};

function getErrorCode(response) {
    // Didn't want to enable --harmony to get the optional chaining operator
    return response && response.error ? response.error.code : undefined;
}

module.exports = api;

