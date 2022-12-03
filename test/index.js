const fs = require("fs")
const path = require("path")
const child = require("child_process")
const COLORS = require("../src/colors")

const cwd = process.cwd()
const testFolder = path.join(cwd, "test")

const restore = (root) => {
    const content = fs.readFileSync(path.join(root, "restore.json")).toString("utf-8")
    fs.writeFileSync(path.join(root, "package.json"), content)

    try {
        fs.rmSync(path.join(root, "node_modules"), { force: true, recursive: true })
    } catch (err) {
        if (err.code == "ENOENT") { }
        else console.log(err)
    }

    try {
        fs.rmSync(path.join(root, "package-lock.json"))
    } catch (err) {
        if (err.code == "ENOENT") { }
        else console.log(err)
    }
}

const check = (root) => {
    const content = JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, "package.json")).toString("utf-8")))
    const check = JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, "check.json")).toString("utf-8")))

    console.log("  expected: ", check)
    console.log("  result:   ", content)

    if (content === check) {
        console.log(COLORS.FgGreen("> test Ok\n"))
    }
    else {
        console.log(COLORS.BgRed("!> test failed - unexpected result in package.json "))
        console.log()
        process.exit(1)
    }
}

const tests = fs
    .readdirSync(testFolder)
    .map(name => path.join(testFolder, name))
    .filter(path => fs.lstatSync(path).isDirectory())

tests.forEach(test => {
    try {
        console.log(COLORS.FgYellow(`> test: ${test.split("/")[test.split("/").length - 1]}`))
        child.execSync(`node ${path.join(cwd, "bin")} ${test} -ydo`)
        check(test)
    } catch (err) {
        restore(test)
        process.exit(1)
    }
    restore(test)
})