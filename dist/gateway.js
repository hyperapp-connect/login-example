'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ws = require('ws');
require('stream');
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var express = _interopDefault(require('express'));
var cryptography = require('@magic/cryptography');
var knex = _interopDefault(require('knex'));

const mapActions = ({ actions, name }) => {
  let action = actions;

  name.split('.').forEach(k => {
    if (typeof action !== 'function' && action[k]) {
      action = action[k];
    }
  });

  return action
};

const { Server } = ws;

const socket$1 = async props => {
  const server = await new Server(props);

  server.on('connection', client => {
    client.on('message', msg => {
      try {
        msg = JSON.parse(msg);
      } catch (err) {
        props.error(err);
      }

      const [name, body] = msg;
      console.log('receive', name, body);

      const request = {
        name,
        body,
        client,
      };

      const response = {
        send: data => {
          const res = [name.replace('v0.', '')];

          if (data) {
            res.push(data);
          }

          console.log('send', res);

          client.send(JSON.stringify(res.filter(e => typeof e !== 'undefined')));
        },
      };

      const action = mapActions({ actions: props.actions, name: request.name });

      if (typeof action === 'function') {
        if (props.db) {
          response.db = props.db;
        }

        action(request, response);
      } else {
        client.send('Unknown Action');
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

/*! Hyperapp Render | MIT Licence | https://github.com/hyperapp/render */

const fp = path.join(process.cwd(), 'src', 'client', 'index.html');
const html = fs.readFileSync(fp).toString();
const splitPoint = '<body>';
const [head, footer] = html.split(splitPoint);

const router = express.Router();

// this is needed for ssr rendering.
// if window is not set rendering will throw
global.window = {
  location: {
    pathname: '/',
  },
};

const defaultProps$1 = {
  host: 'localhost',
  port: 3000,
  protocol: 'http',
  actions: {},
  serve: [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'src', 'client', 'assets'),
  ],
};

const env = process.env.NODE_ENV || 'development';

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
    Form$1({
      form: actions.forms.register,
      state: state.forms.register,
      actions: actions}
    )
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
          noState: true,
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
          noState: true,
          required: true,
        },
        password2: {
          type: 'password',
          equal: 'password',
          placeholder: '*********',
          min: 6,
          noState: true,
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
      submit: res => {
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

const submit$1 = async (req, res) => {
  const { name, password } = req.body;

  let error = undefined;
  let user = undefined;

  try {
    user = await res
      .db('users')
      .first(['password', 'email'])
      .where({ name });

    const compared = await cryptography.hash.compare(password, user.password);

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
    const token = await cryptography.random.bytes();
    data.user = { name, ...user, token };
  }

  console.log('response data', data);

  res.send(data);
};

var login = /*#__PURE__*/Object.freeze({
  submit: submit$1
});

const submit$2 = async (req, res) => {
  let error = undefined;

  try {
    const { name, password, password2, email } = req.body;
    const pwHash = await cryptography.hash(password);

    if (password !== password2) {
      throw new Error('Password mismatch')
    }

    await res.db.table('users').insert({ name, password: pwHash, email });
  } catch (e) {
    error = e;
  }

  const data = {
    ok: !error,
  };

  if (error) {
    data.error = error;
  } else {
    const token = await cryptography.random.bytes();
    data.user = { name, email, token };
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

const configString = fs.readFileSync(path.join(process.cwd(), 'knexfile.json'));
const config = JSON.parse(configString);

const env$1 = process.env.NODE_ENV || 'development';

const dbConfig = config[env$1] || config['development'];

let db;
if (!db) {
  db = knex(config[env$1]);
  db.migrate.latest().then(() => db.seed.run());
}

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
  db,
};

// start websockets and http server
socket$1(props);
//# sourceMappingURL=gateway.js.map
