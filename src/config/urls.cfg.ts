import RegEx from '../../engine/libs/regex'

export const api = Object.freeze({
  prefix: '/api',
  client: '/client',
  swap:   '/swap',
  error:  '/client/report',
}),

gui = Object.freeze({
  splashRedirect: RegEx(/\/index(?:\.html?)?|\/home(?:\.html?)?/),
  manage: Object.freeze({
    prefix: '/manage',
    game:   '/game',
    form:   '/form',
  }),
  root: Object.freeze({
    login:  '/login',
    logout: '/logout',
  }),
  basic: Object.freeze({
    prefix: '/gui',
    home: '/db',
    user: '/profile',
    swap: '/swap',
    form: '/form',
    find: '/results',
    token: '/regenToken',
  }),
  admin: Object.freeze({
    prefix: '/admin',
    home:  '/settings',
    user:  '/users',
    logs:  '/logs',
    form:  '/form',
    find: '/results',
    token: '/regenToken',
  }),
})

export const landingPage = Object.freeze({
  gui:   gui.basic.prefix + gui.manage.prefix,
  admin: gui.admin.prefix + gui.admin.home,
  login: gui.basic.prefix + gui.manage.prefix,
  logout: gui.root.login,
})

// Add URL to force 301 redirect instead of using index.pug splash page
export const overrideSplash = 'https://www.settle.gg'

export const jquery = Object.freeze({
  // src: "/javascripts/jquery-3.6.0.min.js", // Local copy
  src: "https://code.jquery.com/jquery-3.6.0.min.js",
  integrity: "sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=",
}),

minicss = Object.freeze({
  // href: "/stylesheets/mini-dark.min.css", // Local copy
  href: "https://cdn.jsdelivr.net/gh/Chalarangelo/mini.css@v3.0.1/dist/mini-dark.min.css",
  // href: "https://cdnjs.cloudflare.com/ajax/libs/mini.css/2.3.7/mini-dark.css", // WRONG STYLES
})