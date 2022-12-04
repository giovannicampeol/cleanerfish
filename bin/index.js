#!/usr/bin/env node

const cleanerfish = require("../src/index.js")
cleanerfish.parse()
process.on("exit", () => console.log())