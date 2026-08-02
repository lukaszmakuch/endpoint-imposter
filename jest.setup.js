const waitForExpect = require('wait-for-expect');
const dns = require('dns');

// axios 1.x / Node may prefer IPv6 for "localhost"; the mock server binds IPv4.
dns.setDefaultResultOrder('ipv4first');

waitForExpect.defaults.timeout = 1000;