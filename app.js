const api = require('./src/api.js');
const fastify = require('fastify')({ logger: true });
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

// The service worker needs to be served from the root path "/"
// in order to have a global scope
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
            // Everything time we can't fetch the desired data we just error out.
            // The client knows how to handle it.
            // I haven't configured the right error codes though, to make it semantically
            // fit, but that's something I would definitely do, since it helps to debug and understand
            // the specific situation.
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

        const rate = await api.getConversionRate(sourceCurrency, targetCurrency);
        if (typeof rate !== 'number') {
            throw new Error(`Could not retrieve rates to convert from ${sourceCurrency} to ${targetCurrency}`);
        }

        return { convertedAmount: (parseFloat(amount) * rate).toFixed(2) };
    }
});

(async () => {
    try {
        await fastify.listen({ port: 8080, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
})();
