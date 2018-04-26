var app = (function (exports) {
  'use strict';

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

    function set(path, value, source) {
      var target = {};
      if (path.length) {
        target[path[0]] =
          path.length > 1 ? set(path.slice(1), value, source[path[0]]) : value;
        return clone(source, target)
      }
      return value
    }

    function get(path, source) {
      var i = 0;
      while (i < path.length) {
        source = source[path[i++]];
      }
      return source
    }

    function wireStateToActions(path, state, actions) {
      for (var key in actions) {
        typeof actions[key] === "function"
          ? (function(key, action) {
              actions[key] = function(data) {
                var result = action(data);

                if (typeof result === "function") {
                  result = result(get(path, globalState), actions);
                }

                if (
                  result &&
                  result !== (state = get(path, globalState)) &&
                  !result.then // !isPromise
                ) {
                  scheduleRender(
                    (globalState = set(path, clone(state, result), globalState))
                  );
                }

                return result
              };
            })(key, actions[key])
          : wireStateToActions(
              path.concat(key),
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

  function createMatch(isExact, path, url, params) {
    return {
      isExact: isExact,
      path: path,
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

  function parseRoute(path, url, options) {
    if (path === url || !path) {
      return createMatch(path === url, path, url)
    }

    var exact = options && options.exact;
    var paths = trimTrailingSlash(path).split("/");
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

    return createMatch(false, path, url.slice(0, -1), params)
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

  let ws = undefined;

  const cache = [];
  let open = false;
  let apiVersion = "v0";

  let error = (...msg) => console.error(...msg);

  const isString = o => typeof o === "string";
  const isFunction = o => typeof o === "function";

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

  const parse = msg => {
    if (!isString(msg)) {
      return msg
    }

    try {
      return JSON.parse(msg)
    } catch (e) {
      return msg
    }
  };

  const reactions = actions => ({
    onmessage: e => {
      if (e.data === "Unknown Action") {
        error("Unknown Action", e);
        return
      }

      const [path, data] = parse(e.data);
      let action = actions;

      path.split(".").forEach(key => {
        const fnName = `${key}_done`;
        const sub = action[fnName];
        if (isFunction(sub)) {
          action = sub;
        } else {
          action = action[key];
        }
      });

      if (isFunction(action)) {
        return action(data)
      }
    },
    open: () => {
      open = true;

      while (cache.length) {
        const msg = cache.shift();
        ws.send(stringify(msg));
      }
    },
    close: () => {
      open = false;
    }
  });

  const connect = (actions, options = {}) => {
    const host = options.host || location.hostname;
    const port = options.port || location.port;
    const protocol = options.protocol || "ws";

    apiVersion = options.apiVersion || "v0";
    error = options.error || error;

    if (!ws) {
      ws = new WebSocket(`${protocol}://${host}:${port}`);
      open = false;
    }

    const react = reactions(actions);

    ws.onopen = react.open;
    ws.onclose = react.close;
    ws.onmessage = react.onmessage;

    return ws
  };

  const send = msg => {
    if (open) {
      ws.send(stringify(msg));
    } else {
      cache.push(msg);
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

  const connect$1 = connect;
  const mapActions = map;

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

  const submit = (form, state, actions) => evt => {
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
      onsubmit: submit(form, state, actions),
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

  const view = () => h('div', null, [h('h1', null, ["Welcome."]), h('div', null, ["This app is a simple login/registration example."])]);

  const view$1 = (state, actions) => () => h('div', null, [h('h2', null, ["Login"]), Form$1({
    form: actions.forms.login,
    state: state.forms.login,
    actions: actions })]);

  const view$2 = (state, actions) => () => h('div', null, [h('h1', null, ["Register"]), Form$1({
    form: actions.forms.register,
    state: state.forms.register,
    actions: actions })]);

  const view$3 = (state, actions) => () => h('div', null, ["404 - Not found"]);

  const view$4 = () => h('ul', null, [h('li', null, [Link({ to: "/" }, ["Home"])]), h('li', null, [Link({ to: "/login" }, ["Login"])]), h('li', null, [Link({ to: "/register" }, ["Register"])])]);

  const state = {
    location: location$1.state,

    counter: {
      value: 0
    },

    user: {
      name: '',
      email: '',
      token: ''
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
            required: true
          },
          password: {
            type: 'password',
            placeholder: '*********',
            min: 6,
            noState: true,
            required: true
          }
        }
      },

      register: {
        action: 'register',
        method: 'POST',
        inputs: {
          name: {
            type: 'text',
            placeholder: 'Your username',
            min: 6,
            required: true
          },
          email: {
            type: 'email',
            placeholder: 'Your email',
            min: 4,
            required: true
          },
          password: {
            type: 'password',
            placeholder: '*********',
            min: 6,
            noState: true,
            required: true
          },
          password2: {
            type: 'password',
            equal: 'password',
            placeholder: '*********',
            min: 6,
            noState: true,
            required: true
          }
        }
      }
    }
  };

  const local = {
    location: location$1.actions,

    user: {
      login: res => () => console.log('user login callback', { res }) || res,
      register: res => () => console.log('register callback', { res }) || res
    },

    forms: {
      login: {
        validate: validateForm
      },
      register: {
        validate: validateForm
      }
    }
  };

  const remote = {
    forms: {
      login: {
        submit: res => {
          console.log('login submit_done', { res });
          if (res.ok) {
            actions.user.login(res);
            return;
          }

          return {
            errors: res.errors
          };
        }
      },

      register: {
        submit: res => {
          console.log('register submit done', { state, actions, res });
          if (res.ok) {
            actions.user.register(res);
            return;
          }

          return {
            errors: res.errors
          };
        }
      }
    }

    // create the actions
  };const actions = mapActions(local, remote);

  // just a usual hyperapp view
  const view$5 = (state, actions) => h('div', null, [view$4(), Route({ path: "/login", render: view$1(state, actions) }), Route({ path: "/register", render: view$2(state, actions) }), Route({ path: "/", render: view }), Route({ path: "*", render: view$3() }), JSON.stringify(state)]);

  const connected = app(state, actions, view$5, document.body);

  // socket server connection options
  const options = {
    host: 'localhost',
    protocol: 'ws',
    port: 3001

    // wires the app and mounts it.
  };const ws$1 = connect$1(connected, options);

  const router = location$1.subscribe(connected.location);

  exports.connected = connected;
  exports.ws = ws$1;
  exports.router = router;

  return exports;

}({}));
//# sourceMappingURL=bundle.js.map
