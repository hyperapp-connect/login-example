'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ws = require('ws');
var stream = require('stream');
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var express = _interopDefault(require('express'));
var levelup = _interopDefault(require('levelup'));
var leveldown = _interopDefault(require('leveldown'));
require('@magic/cryptography');

const mapActions = ({ actions, name }) => {
  let action = actions;

  name.split(".").forEach(k => {
    if (typeof action !== "function" && action[k]) {
      action = action[k];
    }
  });

  return action
};

const { Server } = ws;

const defaultProps = {
  host: "localhost",
  port: 3001,
  protocol: "ws",
  actions: {}
};

const init = async props => {
  const server = await new Server(props);

  server.on("connection", client => {
    client.on("message", msg => {
      try {
        msg = JSON.parse(msg);
      } catch (err) {
        props.error(err);
      }

      const [name, body] = msg;

      const request = {
        name,
        body,
        client
      };

      console.log("receive", name, body);

      const response = {
        send: data => {
          const res = [name.replace("v0.", "")];

          if (data) {
            res.push(data);
          }

          console.log("send", res);

          client.send(JSON.stringify(res));
        }
      };

      const action = mapActions({ actions: props.actions, name: request.name });

      if (typeof action === "function") {
        action(request, response);
      } else {
        client.send("Unknown Action");
      }
    });
  });

  console.log(`socket server listening on ${props.port}`);
  return server
};

function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();
    if (node && node.pop) {
      for (length = node.length; length--; ) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function"
    ? name(attributes || {}, children)
    : {
        nodeName: name,
        attributes: attributes || {},
        children: children,
        key: attributes && attributes.key
      }
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = (container && container.children[0]) || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));

  scheduleRender();

  return wiredActions

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function(element) {
        return element.nodeType === 3 // Node.TEXT_NODE
          ? element.nodeValue
          : recycleElement(element)
      })
    }
  }

  function resolveNode(node) {
    return typeof node === "function"
      ? resolveNode(node(globalState, wiredActions))
      : node != null ? node : ""
  }

  function render() {
    skipRender = !skipRender;

    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, (oldNode = node));
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];
    for (var i in source) out[i] = source[i];

    return out
  }

  function set(path$$1, value, source) {
    var target = {};
    if (path$$1.length) {
      target[path$$1[0]] =
        path$$1.length > 1 ? set(path$$1.slice(1), value, source[path$$1[0]]) : value;
      return clone(source, target)
    }
    return value
  }

  function get(path$$1, source) {
    var i = 0;
    while (i < path$$1.length) {
      source = source[path$$1[i++]];
    }
    return source
  }

  function wireStateToActions(path$$1, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function"
        ? (function(key, action) {
            actions[key] = function(data) {
              var result = action(data);

              if (typeof result === "function") {
                result = result(get(path$$1, globalState), actions);
              }

              if (
                result &&
                result !== (state = get(path$$1, globalState)) &&
                !result.then // !isPromise
              ) {
                scheduleRender(
                  (globalState = set(path$$1, clone(state, result), globalState))
                );
              }

              return result
            };
          })(key, actions[key])
        : wireStateToActions(
            path$$1.concat(key),
            (state[key] = clone(state[key])),
            (actions[key] = clone(actions[key]))
          );
    }

    return actions
  }

  function getKey(node) {
    return node ? node.key : null
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event)
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") ; else if (name === "style") {
      for (var i in clone(oldValue, value)) {
        var style = value == null || value[i] == null ? "" : value[i];
        if (i[0] === "-") {
          element[name].setProperty(i, style);
        } else {
          element[name][i] = style;
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element =
      typeof node === "string" || typeof node === "number"
        ? document.createTextNode(node)
        : (isSvg = isSvg || node.nodeName === "svg")
          ? document.createElementNS(
              "http://www.w3.org/2000/svg",
              node.nodeName
            )
          : document.createElement(node.nodeName);

    var attributes = node.attributes;
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function() {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(
          createElement(
            (node.children[i] = resolveNode(node.children[i])),
            isSvg
          )
        );
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (
        attributes[name] !==
        (name === "value" || name === "checked"
          ? element[name]
          : oldAttributes[name])
      ) {
        updateAttribute(
          element,
          name,
          attributes[name],
          oldAttributes[name],
          isSvg
        );
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
    if (cb) {
      lifecycle.push(function() {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }
    return element
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;
    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) ; else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(
        element,
        oldNode.attributes,
        node.attributes,
        (isSvg = isSvg || node.nodeName === "svg")
      );

      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];

        var oldKey = getKey(oldChildren[i]);
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey((children[k] = resolveNode(children[k])));

        if (newKeyed[oldKey]) {
          i++;
          continue
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }
          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(
              element,
              element.insertBefore(keyedNode[0], oldElements[i]),
              keyedNode[1],
              children[k],
              isSvg
            );
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }
        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }
    return element
  }
}

/*! Hyperapp Render | MIT Licence | https://github.com/hyperapp/render */

var styleNameCache = new Map();
var uppercasePattern = /([A-Z])/g;
var msPattern = /^ms-/;
var voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
var ignoreAttributes = new Set(['key', 'innerHTML', '__source']);
var escapeRegExp = /["&'<>]/g;
var escapeLookup = new Map([['"', '&quot;'], ['&', '&amp;'], ["'", '&#39;'], ['<', '&lt;'], ['>', '&gt;']]);

function escaper(match) {
  return escapeLookup.get(match);
}

function escapeHtml(value) {
  if (typeof value === 'number') {
    return '' + value;
  }

  return ('' + value).replace(escapeRegExp, escaper);
}

function hyphenateStyleName(styleName) {
  return styleNameCache.get(styleName) || styleNameCache.set(styleName, styleName.replace(uppercasePattern, '-$&').toLowerCase().replace(msPattern, '-ms-')).get(styleName);
}

function stringifyStyles(styles) {
  var out = '';
  var delimiter = '';
  var styleNames = Object.keys(styles);

  for (var i = 0; i < styleNames.length; i++) {
    var styleName = styleNames[i];
    var styleValue = styles[styleName];

    if (styleValue != null) {
      if (styleName === 'cssText') {
        out += delimiter + styleValue;
      } else {
        out += delimiter + hyphenateStyleName(styleName) + ':' + styleValue;
      }

      delimiter = ';';
    }
  }

  return out || null;
}

function renderFragment(_ref, stack) {
  var nodeName = _ref.nodeName,
      attributes = _ref.attributes,
      children = _ref.children;
  var out = '';
  var footer = '';

  if (nodeName) {
    out += '<' + nodeName;
    var keys = Object.keys(attributes);

    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      var value = attributes[name];

      if (name === 'style' && value && typeof value === 'object') {
        value = stringifyStyles(value);
      }

      if (value != null && value !== false && typeof value !== 'function' && !ignoreAttributes.has(name)) {
        out += ' ' + name;

        if (value !== true) {
          out += '="' + escapeHtml(value) + '"';
        }
      }
    }

    if (voidElements.has(nodeName)) {
      out += '/>';
    } else {
      out += '>';
      footer = '</' + nodeName + '>';
    }
  }

  var innerHTML = attributes.innerHTML;

  if (innerHTML != null) {
    out += innerHTML;
  }

  if (children.length > 0) {
    stack.push({
      childIndex: 0,
      children: children,
      footer: footer
    });
  } else {
    out += footer;
  }

  return out;
}

function resolveNode(node, state, actions) {
  if (typeof node === 'function') {
    return resolveNode(node(state, actions), state, actions);
  }

  return node;
}

function renderer(view, state, actions) {
  var stack = [{
    childIndex: 0,
    children: [view],
    footer: ''
  }];
  var end = false;
  return function (bytes) {
    if (end) {
      return null;
    }

    var out = '';

    while (out.length < bytes) {
      if (stack.length === 0) {
        end = true;
        break;
      }

      var frame = stack[stack.length - 1];

      if (frame.childIndex >= frame.children.length) {
        out += frame.footer;
        stack.pop();
      } else {
        var node = resolveNode(frame.children[frame.childIndex++], state, actions);

        if (node != null && typeof node !== 'boolean') {
          if (node.pop) {
            stack.push({
              childIndex: 0,
              children: node,
              footer: ''
            });
          } else if (node.attributes) {
            out += renderFragment(node, stack);
          } else {
            out += escapeHtml(node);
          }
        }
      }
    }

    return out;
  };
}
function renderToString(view, state, actions) {
  return renderer(view, state, actions)(Infinity);
}

function renderToStream(view, state, actions) {
  var _read = renderer(view, state, actions);

  return new stream.Readable({
    read: function read(size) {
      try {
        this.push(_read(size));
      } catch (err) {
        this.emit('error', err);
      }
    }
  });
}
function withRender$1(nextApp) {
  return function (initialState, actionsTemplate, view, container) {
    var actions = nextApp(initialState, Object.assign({}, actionsTemplate, {
      getState: function getState() {
        return function (state) {
          return state;
        };
      }
    }), view, container);

    actions.toString = function () {
      return renderToString(view, actions.getState(), actions);
    };

    actions.toStream = function () {
      return renderToStream(view, actions.getState(), actions);
    };

    return actions;
  };
}

const fp = path.join(process.cwd(), "src", "client", "index.html");
const html = fs.readFileSync(fp).toString();
const splitPoint = "<body>";
const [head, footer] = html.split(splitPoint);

const render = props => (req, res) => {
  res.type("text/html");
  res.write(head + splitPoint);

  const { client } = props;

  // make the router render the correct view
  client.state.location = {
    pathname: req.path
  };

  const main = withRender$1(app)(client.state, client.actions, client.view);
  const stream$$1 = main.toStream();

  stream$$1.pipe(res, { end: false });
  stream$$1.on("end", () => {
    res.write(footer);
    res.end();
  });
};

const router = express.Router();

const routeActions = props => {

  Object.keys(props.actions).forEach(name => {
    const action = props.actions[name];
    const path$$1 = props.parent ? `${props.parent}/${name}` : `/${name}`;

    if (typeof action === "object") {
      routeActions({ parent: path$$1, actions: action, router });
    }

    if (typeof action === "function") {
      props.router.get(path$$1, (req, res) =>
        res.end("GET not supported, use POST")
      );
      props.router.post(path$$1, action);
    }
  });
};

const init$1 = ({ actions }) => {
  // middleware that is specific to this router
  router.use((req, res, next) => {
    console.log("Time: ", Date.now());
    next();
  });

  // define the home route
  router.get("/", (req, res) => {
    res.redirect("/v0");
  });

  const flattenActions = a => {
    const b = {};
    Object.keys(a).forEach(k => {
      const act = a[k];
      if (typeof act === "object") {
        b[k] = flattenActions(a[k]);
      } else if (typeof act === "function") {
        b[k] = "action";
      }
    });

    return b
  };

  router.get("/v0", (req, res) => {
    const actionNames = flattenActions(actions);
    res.send(actionNames);
  });

  routeActions({ actions, router });

  return router
};

// this is needed for ssr rendering.
// if window is not set rendering will throw
global.window = {
  location: {
    pathname: "/"
  }
};

const defaultProps$1 = {
  host: "localhost",
  port: 3000,
  protocol: "http",
  actions: {},
  serve: [
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "src", "client", "assets")
  ]
};

const init$2 = async (p = {}) => {
  const props = Object.assign({}, defaultProps$1, p);
  const { host, port, protocol, actions, serve, client } = props;

  const app = express();

  serve.forEach(p => app.use(express.static(p, { index: "index.html" })));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use("/api", init$1({ actions }));

  app.use((req, res, next) => {
    // this is needed for ssr rendering the hyperapp/router
    global.window = {
      location: {
        pathname: req.path
      }
    };

    next();
  });

  app.use(render(props));

  app.listen(port, () => console.log(`http server listening to ${port}`));
  return app
};

const env = process.env.NODE_ENV || "development";

const quiet = e => {
  console.error(e);
};
const loud = e => {
  if (e instanceof Error) {
    throw e
  } else {
    throw new Error(JSON.stringify(e))
  }
};

const defaultProps$2 = {
  error: env === "development" ? loud : quiet,
  host: "localhost",
  actions: {}
};

const init$3 = async (props = {}) => {
  props = Object.assign({}, defaultProps$2, props);

  const wsProps = Object.assign({}, defaultProps$2, defaultProps, props);
  const httpProps = Object.assign({}, defaultProps$2, defaultProps$1, props);

  const socket = await init(wsProps);
  const http = await init$2(httpProps);

  return { socket, http }
};

let ws$1 = undefined;
let open = false;
let apiVersion = "v0";

let error = (...msg) => console.error(...msg);

const isString = o => typeof o === "string";

const stringify = msg => {
  try {
    if (isString(msg)) {
      msg = JSON.parse(msg);
    }

    msg[0] = `${apiVersion}.${msg[0]}`;

    return JSON.stringify(msg)
  } catch (e) {
    error(e);
  }
};

const send = msg => {
  if (open) {
    ws$1.send(stringify(msg));
  }
};

const map = (actions = {}, remote = {}, parent = null) => {
  Object.keys(remote).forEach(name => {
    const action = remote[name];
    const key = parent ? `${parent}.${name}` : name;

    if (typeof action === "function") {
      actions[name + "_done"] = action;

      actions[name] = data => {
        const msg = [key, data];
        send(msg);
      };

      return
    }

    if (typeof action === "object") {
      actions[name] = map(actions[name], action, key);
      return
    }
  });

  return actions
};

const mapActions$1 = map;

const ErrorMsg = ({ error }) => {
  if (!error || error.length === 0) {
    return
  }

  if (typeof error === 'string') {
    return (
      h('div', {
        style: {
          color: 'red',
        }
      }, [
        error
      ])
    )
  }

  if (Array.isArray(error) || typeof error === 'object') {
    return Object.keys(error).map(key =>
      ErrorMsg({ error: `${key} ${JSON.stringify(error[key])}` }),
    )
  }
};

const Input = (props = {}) => (
  h('input', {
    type: props.type || 'text',
    placeholder: props.placeholder,
    min: props.min,
    max: props.max,
    equal: props.equal,
    required: props.required,
    name: props.name}
  )
);

const capitalize = str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

const validateInput = ({ input, inputs }) => {
  if (!input || input.type === 'submit' || !input.name) {
    return
  }

  const { name, value, type, required, max, min, equal } = input;
  let error = undefined;

  if (required && !value) {
    error = 'Please enter a value';
  } else if (min && value.length < parseInt(min, 10)) {
    error = `${capitalize(name)} is too short`;
  } else if (max && value.length > parseInt(max, 10)) {
    error = `${capitalize(name)} is too long`;
  }

  if (type === 'email' && value.indexOf('@') === -1) {
    error = 'Email must be valid';
  }

  if (equal) {
    const ele = inputs[equal].value;
    if (!value || !ele || value !== ele) {
      error = `${capitalize(equal)}s must be equal`;
    }
  }

  return error
};

const validateForm = ({ evt, state }) => {
  const errors = {};
  let hasErrored = false;

  const inputs = evt.currentTarget.getElementsByTagName('input');

  Object.keys(state.inputs)
    .filter(k => state.inputs[k].type !== 'submit')
    .map(key => {
      const input = state.inputs[key];
      input.name = key;
      input.value = inputs[key].value;
      const err = validateInput({ input, inputs });

      if (err) {
        errors.inputs = errors.inputs || {};
        errors.inputs[key] = err;
        hasErrored = true;
      }
    });

  return { errors, hasErrored }
};

const submit = (state, actions) => evt => {
  evt.preventDefault();

  const { hasErrored } = validateForm({ evt, form, state });

  if (hasErrored) {
    return
  }

  const data = {};
  Object.keys(state.inputs).map(key => {
    data[key] = state.inputs[key].value;
  });

  form.submit(data);
};

const Form$1 = ({ actions, errors, state, form, title, submitValue }) => (
  h('form', {
    novalidate: true,
    action: state.action,
    method: state.method || 'POST',
    onsubmit: submit(state, actions),
    onchange: evt => form.validate({ evt, form, state })
  }, [
    title && (
      h('legend', null, [
        h('h2', null, [title])
      ])
    ),
    ErrorMsg({error: state.errors && state.errors.submit}),
    h('fieldset', null, [
      Object.keys(state.inputs).map(k => (
        h('div', null, [
          Input(Object.assign({name: k}, state.inputs[k])),
          ErrorMsg({error: state.hasErrored && state.errors.inputs[k]})
        ])
      ))
    ]),

    h('input', {type: "submit", value: submitValue || 'Submit'})
  ])
);

const view = () => (
  h('div', null, [
    h('h1', null, ["Welcome."]),

    h('div', null, ["This app is a simple login/registration example."])
  ])
);

const view$1 = (state, actions) => () => (
  h('div', null, [
    h('h2', null, ["Login"]),
    Form$1({
      form: actions.forms.login,
      state: state.forms.login,
      actions: actions}
    )
  ])
);

const view$2 = (state, actions) => () => (
  h('div', null, [
    h('h1', null, ["Register"]),
    Form$1({form: actions.forms.register, state: state.forms.register})
  ])
);

const view$3 = (state, actions) => () => h('div', null, ["404 - Not found"]);

function getOrigin(loc) {
  return loc.protocol + "//" + loc.hostname + (loc.port ? ":" + loc.port : "")
}

function isExternal(anchorElement) {
  // Location.origin and HTMLAnchorElement.origin are not
  // supported by IE and Safari.
  return getOrigin(location) !== getOrigin(anchorElement)
}

function Link(props, children) {
  return function(state, actions) {
    var to = props.to;
    var location = state.location;
    var onclick = props.onclick;
    delete props.to;
    delete props.location;

    props.href = to;
    props.onclick = function(e) {
      if (onclick) {
        onclick(e);
      }
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        props.target === "_blank" ||
        isExternal(e.currentTarget)
      ) ; else {
        e.preventDefault();

        if (to !== location.pathname) {
          history.pushState(location.pathname, "", to);
        }
      }
    };

    return h("a", props, children)
  }
}

function createMatch(isExact, path$$1, url, params) {
  return {
    isExact: isExact,
    path: path$$1,
    url: url,
    params: params
  }
}

function trimTrailingSlash(url) {
  for (var len = url.length; "/" === url[--len]; );
  return url.slice(0, len + 1)
}

function decodeParam(val) {
  try {
    return decodeURIComponent(val)
  } catch (e) {
    return val
  }
}

function parseRoute(path$$1, url, options) {
  if (path$$1 === url || !path$$1) {
    return createMatch(path$$1 === url, path$$1, url)
  }

  var exact = options && options.exact;
  var paths = trimTrailingSlash(path$$1).split("/");
  var urls = trimTrailingSlash(url).split("/");

  if (paths.length > urls.length || (exact && paths.length < urls.length)) {
    return
  }

  for (var i = 0, params = {}, len = paths.length, url = ""; i < len; i++) {
    if (":" === paths[i][0]) {
      params[paths[i].slice(1)] = urls[i] = decodeParam(urls[i]);
    } else if (paths[i] !== urls[i]) {
      return
    }
    url += urls[i] + "/";
  }

  return createMatch(false, path$$1, url.slice(0, -1), params)
}

function Route(props) {
  return function(state, actions) {
    var location = state.location;
    var match = parseRoute(props.path, location.pathname, {
      exact: !props.parent
    });

    return (
      match &&
      props.render({
        match: match,
        location: location
      })
    )
  }
}

function wrapHistory(keys) {
  return keys.reduce(function(next, key) {
    var fn = history[key];

    history[key] = function(data, title, url) {
      fn.call(this, data, title, url);
      dispatchEvent(new CustomEvent("pushstate", { detail: data }));
    };

    return function() {
      history[key] = fn;
      next && next();
    }
  }, null)
}

var location$1 = {
  state: {
    pathname: window.location.pathname,
    previous: window.location.pathname
  },
  actions: {
    go: function(pathname) {
      history.pushState(null, "", pathname);
    },
    set: function(data) {
      return data
    }
  },
  subscribe: function(actions) {
    function handleLocationChange(e) {
      actions.set({
        pathname: window.location.pathname,
        previous: e.detail
          ? (window.location.previous = e.detail)
          : window.location.previous
      });
    }

    var unwrap = wrapHistory(["pushState", "replaceState"]);

    addEventListener("pushstate", handleLocationChange);
    addEventListener("popstate", handleLocationChange);

    return function() {
      removeEventListener("pushstate", handleLocationChange);
      removeEventListener("popstate", handleLocationChange);
      unwrap();
    }
  }
};

const view$4 = () => (
  h('ul', null, [
    h('li', null, [
      Link({to: "/"}, ["Home"])
    ]),
    h('li', null, [
      Link({to: "/login"}, ["Login"])
    ]),
    h('li', null, [
      Link({to: "/register"}, ["Register"])
    ])
  ])
);

const state = {
  location: location$1.state,

  counter: {
    value: 0,
  },

  user: {
    name: '',
    email: '',
    token: '',
  },

  forms: {
    login: {
      action: 'login',
      method: 'POST',
      inputs: {
        name: {
          type: 'text',
          placeholder: 'Your username',
          min: 6,
          required: true,
        },
        password: {
          type: 'password',
          placeholder: '*********',
          min: 6,
          required: true,
        },
      },
    },

    register: {
      action: 'register',
      method: 'POST',
      inputs: {
        name: {
          type: 'text',
          placeholder: 'Your username',
          min: 6,
          required: true,
        },
        email: {
          type: 'email',
          placeholder: 'Your email',
          min: 4,
          required: true,
        },
        password: {
          type: 'password',
          placeholder: '*********',
          min: 6,
          required: true,
        },
        password2: {
          type: 'password',
          equal: 'password',
          placeholder: '*********',
          min: 6,
          required: true,
        },
      },
    },
  },
};

const local = {
  location: location$1.actions,

  user: {
    login: res => () => console.log('user login callback', { res }) || res,
    register: res => () => console.log('register callback', { res }) || res,
  },

  forms: {
    login: {
      validate: validateForm,
    },
    register: {
      validate: validateForm,
    },
  },
};

const remote = {
  forms: {
    login: {
      submit: res => {
        console.log('login submit_done', { res });
        if (res.ok) {
          actions.user.login(res);
          return
        }

        return {
          errors: res.errors,
        }
      },
    },

    register: {
      submit: res => (state, actions) => {
        console.log('register submit done', { state, actions, res });
        if (res.ok) {
          actions.user.register(res);
          return
        }

        return {
          errors: res.errors,
        }
      },
    },
  },
};

// create the actions
const actions = mapActions$1(local, remote);

// just a usual hyperapp view
const view$5 = (state, actions) => (
  h('div', null, [
    view$4(),

    Route({path: "/login", render: view$1(state, actions)}),
    Route({path: "/register", render: view$2(state, actions)}),
    Route({path: "/", render: view}),
    Route({path: "*", render: view$3()}),

    JSON.stringify(state)
  ])
);

var client = /*#__PURE__*/Object.freeze({
  state: state,
  local: local,
  remote: remote,
  actions: actions,
  view: view$5
});

// 1) Create our store
const db$1 = levelup(leveldown('./db'));

const submit$1 = async (req, res) => {
  const { name, password } = req.body;

  let error = undefined;
  let user = undefined;
  try {
    user = await db.get(name);

    const compared = password && password === user.password;

    if (!compared) {
      error = 'Invalid Password';
    }
  } catch (e) {
    if (e.toString().indexOf('NotFoundError') === 0) {
      error = 'User not found';
    } else {
      error = e.toString();
    }
  }

  const data = {
    ok: !error,
  };

  if (error) {
    data.error = error;
  } else {
    data.token = random.bytes();
  }

  console.log('response data', data);

  res.send(data);
};

var login = /*#__PURE__*/Object.freeze({
  submit: submit$1
});

const submit$2 = async (req, res) => {
  let error = undefined;
  let user = undefined;
  try {
    const { name, password, email } = req.body;
    console.log('user registration', { name, password, email });

    user = await db.put(name, { password, email });
  } catch (e) {
    error = e;
  }

  const data = {
    ok: !error,
  };

  const { password, password2, ...userData } = user;

  if (error) {
    data.error = error;
  } else {
    data.user = userData;
    data.user.token = random.bytes();
  }

  res.send(data);
};

var register = /*#__PURE__*/Object.freeze({
  submit: submit$2
});

const forms = {
  login,
  register,
};

const actions$1 = {
  v0: {
    forms,
  },
};

// gather settings for the servers.
// these are the default settings and could be omitted.
const props = {
  actions: actions$1,
  sockets: {
    host: 'localhost',
    port: 3001,
    protocol: 'ws',
  },
  http: {
    host: 'localhost',
    port: 3000,
    protocol: 'http',
    bundleUrl: '/js/bundle.js',
  },
  client,
};

// start websockets and http server
const { socket, http } = init$3(props);
//# sourceMappingURL=server.js.map
