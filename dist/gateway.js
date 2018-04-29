'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ws = require('ws');
var log = _interopDefault(require('@magic/log'));
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

const defaultProps = {
  host: 'localhost',
  port: 3001,
  protocol: 'ws',
  actions: {},
};

const socket$1 = props => {
  props = { ...defaultProps, ...props };
  const server = new ws.Server(props);

  server.on('connection', client => {
    client.on('message', msg => {
      try {
        msg = JSON.parse(msg);
      } catch (err) {
        props.error(err);
      }

      const [name, body] = msg;
      log.info('receive', name, body);

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

          log.info('send', res);

          client.send(JSON.stringify(res.filter(e => typeof e !== 'undefined')));
        },
      };

      const action = mapActions({ actions: props.actions, name: request.name });

      if (typeof action === 'function') {
        if (props.db) {
          response.db = props.db;
        }
        if (props.jwt) {
          response.jwt = props.jwt;
        }

        action(request, response);
      } else {
        client.send('Unknown Action');
      }
    });
  });

  log.info(`socket server listening on ${props.port}`);
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

global.history = {
  pushState: () => {},
  replaceState: () => {},
};

const defaultProps$1 = {
  host: 'localhost',
  port: 3000,
  protocol: 'http',
  actions: {},
  serve: [path.join(process.cwd(), 'dist'), path.join(process.cwd(), 'src', 'client', 'assets')],
};

const env = process.env.NODE_ENV || 'development';

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

const error = (...msg) => console.error(...msg);

const isString = o => typeof o === 'string';

const stringify = msg => {
  try {
    if (isString(msg)) {
      msg = JSON.parse(msg);
    }

    return JSON.stringify(msg)
  } catch (e) {
    error(e);
  }
};

let ws$1 = undefined;
let open = false;
let apiVersion = 'v0';

const send = msg => {
  if (open && ws$1) {
    if (typeof msg[0] === 'string') {
      msg[0] = `${apiVersion}.${msg[0]}`;
    }
    ws$1.send(stringify(msg));
  }
};

const mapActions$1 = (actions = {}, remote = {}, parent = null) => {
  Object.keys(remote).forEach(name => {
    const action = remote[name];
    const key = parent ? `${parent}.${name}` : name;

    if (typeof action === 'function') {
      actions[name + '_done'] = action;

      actions[name] = data => (state = {}) => {
        if (state.jwt) {
          data.jwt = state.jwt;
        }

        const msg = [key, data];
        send(msg);
      };

      return
    }

    if (typeof action === 'object') {
      actions[name] = mapActions$1(actions[name], action, key);
      return
    }
  });

  return actions
};

const actions = {
  checkLogin: (state, actions, reverse = false) => (...args) => {
    if (!reverse) {
      if (state.user.jwt) {
        actions.location.go(state.auth.redirect.login);
      }
    } else if (!state.user.jwt) {
      actions.location.go(state.auth.redirect.logout);
    }
  }
};

const state = {
  auth: {
    redirect: {
      logout: '/login',
      login: '/profile',
    },
  },
};

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

const validate = ({ evt, state }) => {
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

const handleError = res => res.errors;

const submit = (action, state) => evt => {
  evt.preventDefault();

  const { hasErrored, errors } = validate({ evt, state });

  if (hasErrored) {
    return errors
  }

  const data = {};
  Object.keys(state.inputs).map(key => {
    data[key] = state.inputs[key].value;
  });

  action(data);
};

const Form$1 = ({ action, actions, state, title, submitValue }) => (
  h('form', {
    novalidate: true,
    action: state.action,
    method: state.method || 'POST',
    onsubmit: submit(action, state),
    onchange: evt => actions.validate({ evt, state })
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

const local = {
  location: location$1.actions,
  auth: actions.auth,

  forms: {
    login: {
      validate,
      handleError,
    },
    register: {
      validate,
      handleError,
    },
  },
};

const remote = {
  login: res => (state$$1, actions$$1) => {
    console.log('user login callback', { res, actions: actions$$1 });


    if (!res.ok) {
      return {
        errors: res.errors,
      }
    }

    actions$$1.location.go('/profile');

    return {
      user: res.user,
    }
  },
  register: res => () => {
    console.log('register callback', { res });
    if (!res.ok) {
      return {
        errors: res.errors,
      }
    }

    actions$1.location.go('/profile');

    return {
      user: res.user,
    }
  },
  logout: res => () => {
    console.log({ res });
    if (!res.ok) {
      return {
        errors: res.errors
      }
    }

    actions$1.location.go('/login');

    return {
      user: {},
    }
  }
};

// create the actions
const actions$1 = mapActions$1(local, remote);

const state$1 = {
  location: location$1.state,
  auth: state.auth,

  counter: {
    value: 0,
  },

  user: {
    name: '',
    email: '',
    jwt: '',
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

const Home = () => (
  h('div', null, [
    h('h1', null, ["Welcome."]),

    h('div', null, ["This app is a simple login/registration example."])
  ])
);

const Login = (state, actions) => router => (
  h('div', {oncreate: actions.checkLoggedIn}, [
    h('h2', null, ["Login"]),
    Form$1({
      state: state.forms.login,
      actions: actions.forms.login,
      app: { state, actions},
      action: actions.login}
    )
  ])
);

const Profile = (state, actions) => router => (
  h('div', null, [
    h('h2', null, ["Profile"]),
    h('div', null, ["Name: ", state.user.name]),
    h('div', null, ["Email: ", state.user.email])
  ])
);

const Register = (state, actions) => () => (
  h('div', null, [
    h('h1', null, ["Register"]),
    Form$1({
      actions: actions.forms.register,
      state: state.forms.register,
      app: { state, actions},
      action: actions.register}
    )
  ])
);

const E404 = (state, actions) => () => h('div', null, ["404 - Not found"]);

const MenuLink = ({ to, text }) => h('li', null, [Link({to: to}, [text])]);

const Menu = ({ user, logout }) => (
  h('ul', null, [
    h('li', null, [
      Link({to: "/"}, ["Home"])
    ]),
     !user.jwt && MenuLink({to: "/login", text: "Login"}),
     !user.jwt && MenuLink({to: "/register", text: "Register"}),
     user.jwt && MenuLink({to: "/profile", text: "Profile"}),
     user.jwt && h('li', null, [h('a', {onclick: logout}, ["Logout"])])
  ])
);

// just a usual hyperapp view
const view = (state, actions) => (
  h('div', null, [
    Menu({user: state.user, logout: actions.logout}),

    Route({path: "/login", render: Login(state, actions)}),
    Route({path: "/register", render: Register(state, actions)}),
    Route({path: "/profile", render: Profile(state, actions)}),
    Route({path: "/", render: Home}),
    Route({path: "*", render: E404()}),

    JSON.stringify(state)
  ])
);



var client = /*#__PURE__*/Object.freeze({
  actions: actions$1,
  state: state$1,
  view: view
});

const login = async (req, res) => {
  const { name, password } = req.body;

  let error = undefined;
  let user = undefined;

  try {
    user = await res
      .db('users')
      .first(['password', 'email', 'id', 'role'])
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
    const { email, id, role } = user;

    const jwt = await res.jwt.sign({ token, id, role });

    data.user = { name, email, jwt };
  }

  console.log('response data', data);

  res.send(data);
};

const register = async (req, res) => {
  let error = undefined;

  const { name, password, password2, email } = req.body;
  console.log({ body: req.body });

  try {
    const pwHash = await cryptography.hash(password);

    if (password !== password2) {
      throw new Error('Password mismatch')
    }

    await res.db.table('users').insert({ name, password: pwHash, email });
  } catch (e) {
    console.log(e.code, e.code === 'SQLITE_CONSTRAINT');
    if (e.code === 'SQLITE_CONSTRAINT') {
      error = 'User or email already used';
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
    data.user = { name, email, token };
  }

  res.send(data);
};

const logout = async (req, res) => {
  const { name, password, jwt } = req.body;

  res.send({ ok: true });
};



var auth = /*#__PURE__*/Object.freeze({
  login: login,
  register: register,
  logout: logout
});

const actions$2 = {
  v0: {
    ...auth,
  },
};

const configString = fs.readFileSync(path.join(process.cwd(), 'knexfile.json'));
const config = JSON.parse(configString);

const env$1 = process.env.NODE_ENV || 'development';

const dbConfig = config[env$1] || config['development'];

let db;
if (!db) {
  db = knex(config[env$1]);
  if (!db.schema.hasTable('users')) {
    db.migrate.latest().then(() => db.seed.run());
  }
}

const jwt = new cryptography.JWT();

// gather settings for the servers.
// these are the default settings and could be omitted.
const props = {
  actions: actions$2,
  client,
  db,
  jwt,
  http: {
    host: 'localhost',
    port: 3000,
    protocol: 'http',
    bundleUrl: '/js/bundle.js',
  },
  sockets: {
    host: 'localhost',
    port: 3001,
    protocol: 'ws',
  },
};

// start websockets and http server
socket$1(props);
//# sourceMappingURL=gateway.js.map
