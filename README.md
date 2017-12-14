# WebsocketPromisify
Makes websocket's API just like REST with Promise-like API, with native Promises.
Has yummies and very lightweight!

// If you detected some bug or so, please, fill an issue.
// Large data support, streams and different server-side implementations are coming. See 


Makes a Promise-like WebSocket connection.
Features (almost all are tunable via constructor config below.)
- Async/await ready.
- ES-module and commonjs built-in.
- Types (d.ts) included.
- Automatically reconnects.
- You can use the WebSocket (or your ws-like implementation) further in other stuff (socket property).
- Any id and data keys to negotiate with your back-end.
- Lazy connect: connects only if something sent, then send all of them!
- Supports middleware. E.g. you can use 'ws' package in Node!
- Custom easy .on method with or without condition: analog to .addEventListener.
- Can log messages/frames/response time into console or wherever you want to. (Hello, firefox 57+!)
- Any protocols field.
- Rejects if sent into closed socket or after some timeout without response.
- If something sent before connection is estabilished, it sends when its ready.

How it on Server Side ?
```
  1. Serialized JSON is sent by this lib = {id: 'generated_id', data: your data}
  2. Some Server processing...
  3. Serialized JSON is sent back by the Server = {id: 'the same generated_id', data: feedback data}
```


Default constructor config is
```javascript
{
  // You can also use plain text and blobs in future.
  data_type: 'json',
  // Debug features. Not required.
    log: ((event, time, message) => null),
    // Will count milliseconds for responses and put them to log function above.
    timer: false,
  // Set up.
    // Required. URL to connect.
    url: 'localhost',
    // Timeout after sending a message before it dropes with error.
    timeout: 1400,
    // Reconnect timeout in seconds or null.
    reconnect: 2,
    // Lazy connect: connects only if something sent (then sends all of them!)
    lazy: false,
    // You can set your own middleware here.
    adapter: ((host, protocols) => new WebSocket(host, protocols)),
    // WebSocket constructor's protocol field.
    protocols: [],
    // Unique id's and data keys to negotiate with back-end.
    server: {
      id_key: 'id',
      data_key: 'data'
    }
}
```

Fields/Props:
```javascript

  // read-only, returns WebSocket (or so) instance to use with other stuff.
  socket
```

Methods:
```javascript

  // sends any type of message.
  send(message),
  // .addEventListener with optional predicate.
  on(event_name, handler, predicate = (WebSocketEvent) => true),
  // Closes the connection and free up memory.
  close()

```

Example:
```javascript

  import WSP from 'wspromisify'


  const somehost = 'example.com:8080'

  const someFunction = async () => {
    const ws = new WSP({
      url: `${somehost}/ws`,
      timeout: 2e3,
      timer: true,
      log(event, time, message = '') {
        if(time !== null) {
          console.log(event, `in ${time}ms`, message)
        } else {
          console.log(event, message)
        }
      }
    })

    try {
      const data = await ws.send({catSaid: 'Meow!'})
      console.log({data})
    } catch(error) {
      console.error('Cannot send a message due to ', error)
    }
  }

  someFunction()

```