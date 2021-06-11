const api = require('./src/api.js');
const fastify = require('fastify')({ logger: false });
const path = require('path');

fastify.register(require('fastify-compress'));

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
});

fastify.register(require('point-of-view'), {
    engine: {
        ejs: require('ejs')
    }
});

fastify.get('/service-worker.js', (request, reply) => {
    return reply.sendFile('service-worker.js');
});

fastify.route({
    method: 'GET',
    url: '/',
    schema: {
        response: {
            200: {
                type: 'string'
            }
        }
    },
    handler: async (request, reply) => {
        return reply.view('/templates/index.ejs', {
            title: 'Currency converter',
            enableServiceWorker: false
        });
    }
});

fastify.route({
    method: 'GET',
    url: '/currencies',
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    currencies: { type: 'array' }
                }
            }
        }
    },
    handler: async () => {
        const { symbols: currencies, error } = await api.fetch(api.endpoint.symbols);
        if (error) {
            throw new Error('Could not retrieve symbols from the API');
        }

        return { currencies: Object.keys(currencies).map((code) => [code, currencies[code]]) };
    }
});

fastify.route({
    method: 'GET',
    url: '/convert',
    schema: {
        querystring: {
            required: ['from', 'to', 'amount'],
            properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                amount: { type: 'number' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    convertedAmount: { type: 'number' }
                }
            }
        }
    },
    handler: async (request) => {
        const { from: sourceCurrency, to: targetCurrency, amount } = request.query;
        if (sourceCurrency === targetCurrency) {
            return { convertedAmount: parseFloat(amount) };
        }

        const { rates, error } = await api.fetch(api.endpoint.rates, sourceCurrency, [targetCurrency]);
        if (error) {
            throw new Error(`Could not retrieve rates to convert from ${sourceCurrency} to ${targetCurrency}`);
        }

        return { convertedAmount: parseFloat(amount) * parseFloat(rates[targetCurrency]) };
    }
});

(async () => {
    try {
        await fastify.listen(3000);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
})();