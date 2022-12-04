const fs = require("fs")
const COLORS = require("./colors")
const strip = require('strip-comments');

module.exports.checkDependeciesUsageForEachFile = (dependenciesToCheck, filesToInspect, absoluteProjectPath) => {
    const dependenciesByFile = {}
    filesToInspect.forEach(file => {
        console.log(COLORS.FgMagenta(`🐟: checking\t`), file.split(absoluteProjectPath)[1])

        const fileContent = fs
            .readFileSync(file)
            .toString("utf-8")

        const formattedFileContent = strip(fileContent)
            .replace(/\s/g, "")
            .replace(/\t/g, "")
            .replace(/\n/g, "")

        dependenciesByFile[file] = []
        dependenciesToCheck.forEach(dep => {
            const used = isDependencyUsedInFile(formattedFileContent, dep)
            if (used) dependenciesByFile[file].push(dep)
        })
    })

    console.log()
    return dependenciesByFile
}

//TODO complete list of import strings
const isDependencyUsedInFile = (fileContent, dep) => {
    const matches = [
        //es
        `from"${dep}`,
        `from'${dep}`,
        "from`" + dep,
        `from“${dep}`,
        `from'${dep}`,

        //commonjs
        `require("${dep}`,
        `require('${dep}`,
        "require(`" + dep,
        `require(“${dep}`,
        `require('${dep}`,

        //coffeescript
        `require"${dep}`,
        `require'${dep}`,
        "require`" + dep,
        `require“${dep}`,
        `require'${dep}`,
    ]

    return matches
        .map(match => fileContent.includes(match))
        .includes(true)
}