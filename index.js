const compose = require('koa-compose');
const pathToRegex = require('path-to-regexp');
const debug = require('debug')('@helpfulhuman/koa-route');

/**
 * Returns true if the given method matches, or is contained within,
 * the allowed method(s).
 *
 * @param  {String} allowed
 * @param  {String} method
 * @return {Boolean}
 */
function matches (allowed, method) {
  return (
    Array.isArray(allowed) ?
    allowed.indexOf(method) !== -1 :
    allowed === method
  );
}

/**
 * Returns a params object if the route is a match, otherwise,
 * returns null.
 *
 * @param  {Array} args
 * @return {Object}
 */
function getParams (path, ctx) {
  var arg, key, keys = [], params = {};
  var args = pathToRegex(path, keys).exec(ctx.path);
  if (args) {
    args = args.slice(1);
    for (var i = 0; i < args.length; i++) {
      key = keys[i].name;
      arg = args[i];
      params[key] = (arg ? decodeURIComponent(arg) : arg);
    }
    return params;
  }
  return false;
}

/**
 * Passes control flow to the given middleware or handler if the
 * current method and path matches the configured route.
 *
 * @param  {String} method
 * @param  {String} path
 * @param  {Function} middleware
 * @return {Function}
 */
function route (method, path, middleware) {
  if (Array.isArray(middleware)) {
    middleware = compose(middleware);
  }
  return function *(next) {
    if (matches(method, this.method)) {
      const params = getParams(path, this);
      if (params) {
        debug('%s %s matches %s %j', this.method, path, this.path, params);
        this.params = params;
        return yield middleware;
      }
    }
    yield next;
  };
}

module.exports = {
  route: route,
  GET: route.bind(null, ['GET', 'HEAD']),
  POST: route.bind(null, 'POST'),
  PUT: route.bind(null, ['PUT', 'PATCH']),
  DELETE: route.bind(null, 'DELETE')
};