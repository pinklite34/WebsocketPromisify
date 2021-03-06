import './types'
import {
  once,
  add_event
} from './utils'


const init = function(ws: wsc.Socket) {
  const config = this.config
  this.open = true
  this.onReadyQueue.forEach((fn: Function) => fn())
  this.onReadyQueue.splice(0)
  const {id_key, data_key} = config.server
  // Send all pending messages.
  this.messages.forEach((message: any) => message.send())
  // It's reconnecting.
  if(this.reconnect_timeout !== null) {
    clearInterval(this.reconnect_timeout)
    this.reconnect_timeout = null
  }

  add_event(ws, 'close', async () => {
    this.log('Closed.')
    this.open = false
    this.onCloseQueue.forEach((fn: Function) => fn())
    this.onCloseQueue = []
    // Auto reconnect.
    const reconnect = config.reconnect
    if(
      typeof reconnect === 'number' &&
      !isNaN(reconnect) &&
      !this.forcibly_closed
    ) {
      const reconnectFunc = async () => {
        this.log('Trying to reconnect...')
        if(this.ws !== null) {
          this.ws.close()
          this.ws = null
        }
        // If some error occured, try again.
        const status = await this.connect()
        if(status !== null) {
          this.reconnect_timeout = setTimeout(reconnectFunc, reconnect * 1000)
        }
      }
      // No need for await.
      reconnectFunc()
    } else {
      this.ws = null
      this.open = null
    }
    // reset the flag to reuse.
    this.forcibly_closed = false
  })

  add_event(ws, 'message', (e) => {
    try {
      const data = config.decode(e.data)
      if(data[id_key]) {
        const q = this.queue[data[id_key]]
        if(q) {
          // Debug, Log.
          const time = q.sent_time ? (Date.now() - q.sent_time) : null
          this.log('Message.', data[data_key], time)
          // Play.
          q.ff(data[data_key])
          clearTimeout(q.timeout)
          delete this.queue[data[id_key]]
        }
      }
    } catch (err) {
      console.error(err, `Decode error. Got: ${e.data}`)
    }
  })
}

// ---------------------------------------------------------------------------


const connectLib = function(ff: Function) {
  if(this.open === true) {
    return ff(null)
  }
  const config = this.config
  const ws = config.socket || config.adapter(`ws://${config.url}`, config.protocols)
  this.ws = ws
 
  if(!ws || ws.readyState > 1) {
    this.ws = null
    this.log('Error: ready() on closing or closed state! Status 2.')
    return ff(2)
  }

  add_event(ws, 'error', once(() => {
    this.ws = null
    this.log('Error status 3.')
    // Some network error: Connection refused or so.
    return ff(3)
  }))
  // Because 'open' won't be envoked on opened socket.
  if(ws.readyState) {
    init.call(this, ws)
    ff(null)
  } else {
    add_event(ws, 'open', once(() => {
      this.log('Opened.')
      init.call(this, ws)
      return ff(null)
    }))
  }
}


export default connectLib