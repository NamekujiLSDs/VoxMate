const { app, protocol } = require('electron')
const store = require('electron-store');
const log = require('electron-log');
const config = new store()
const path = require('path')
const fs = require('fs')

exports.betterMenu = class {
}