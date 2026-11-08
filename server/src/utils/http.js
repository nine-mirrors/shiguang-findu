export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

export function fail(res, status, message, extra = {}) {
  return res.status(status).json({ message, ...extra })
}

export function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}
