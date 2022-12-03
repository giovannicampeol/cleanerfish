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
        `from"${dep}`,
        `from'${dep}`,
        "from`" + dep,
        `from“${dep}`,
        `from'${dep}`,

        `require("${dep}`,
        `require('${dep}`,
        "require(`" + dep,
        `require(“${dep}`,
        `require('${dep}`,
    ]

    return matches
        .map(match => fileContent.includes(match))
        .includes(true)
}

// const excludeComments = (content) => {
//     return excludeMultiLineComments(excludeSingleLineComments(content))
// }

// const excludeSingleLineComments = (content) => {
//     return content
//         .split("\n")
//         .filter(line => !line.startsWith("//"))
//         .map(line => {
//             return line
//                 .trim()
//                 .split("//")[0]
//         })
//         .join("\n")
// }

// const excludeMultiLineComments = (content) => {
//     let hasMoreComments = false

//     do {
//         const commentStart = content.indexOf("/*")
//         const commentEnd = content.indexOf("*/")

//         if (commentStart > commentEnd) {
//             console.log(COLORS.FgRed(`🐟! looks like there's something wrong in your comments -- POP`))
//             process.exit(1)
//         }

//         content = content.slice(0, commentStart) + content.slice(commentEnd + 2)
        
//         hasMoreComments = content.indexOf("/*") < 0 ? false : true
//     } while (hasMoreComments)

//     return content
// }