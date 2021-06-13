Hi!

I made a number of decisions while developing the exercise that I would like to explain.

## Security

1. I went for a backend powered app since it fits better the key security aspects of the exercise. Like not exposing API keys, not exposing decisions about third party software used, keeping business logic on the backend etc.

2. I didn't perform strict backend params validation (nor XSS stripping/escaping), I just thought of mentioning it here.

3. I assumed Preact is escaping by default the rendered values (like React does).

4. I made sure the installed npm packages don't have any known vulnerability (npm audit, nothing fancy), but I didn't install them from a own local/controlled repository and I didn't perform a manual check of all the module dependencies.

## Client side shape

 1. I went for a simple client side rendering approach with a service   
    worker caching mechanism, since there's not much SEO specific
    content on the Preact app part and I wanted to keep it simple and
    maximize client side caching since my backend is not going to run
    on a very powerful box in any case :) 
    
 2. I didn't create a manifest.json, so we're not talking about a progressive app, but
    that step is very small given we already have a service worker.
    
 3. Normally I would use native modules with a bundler, TypeScript
    and build unit and integration tests, but given the time
    restrictions I wanted to avoid setting up the needed boilerplate.
    Same about client side errors reporting and user interaction
    tracking. I didn't take much care of the UX, sorry :)

## Performance

 1. Mainly I went for serving fewer objects with brotli/gzip compression
    enabled.
    
 2. I didn't take care of caching related headers to sharpen the browser
    caching behaviour.
    
 3. I did add a service worker.
 
 4. I didn't create a caching layer for the third party exchange rates
    API, due to the lack of time and knowledge about what's a reasonable
    invalidation time for such a cache given the nature of exchange
    rates.

## Features

 1. I implemented the basic functionality plus:
 
 2. The bidirectional conversion.
 
 3. window.history support.

	*I thought of those two extra features as the most valuable without having much data to support such a decision though.*

Probably I'm forgetting a couple things but that was it more or less.

Thanks for reading!
Cheers,
Daniel