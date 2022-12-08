const path = require("path")
const COLORS = require("./colors")
const fs = require("fs")

module.exports.resolveMainPaths = (projectPath, directoryPath = undefined) => {
    try {

        let relativeProjectPath
        let absoluteProjectPath
        let relativeFolderPath
        let absoluteFolderPath

        //project path must be relative to process execution
        const isProjectPathAbsolute = path.isAbsolute(projectPath)
        relativeProjectPath = (isProjectPathAbsolute ? projectPath.split(process.cwd())[0] : projectPath) || "./"
        absoluteProjectPath = (isProjectPathAbsolute ? projectPath : path.resolve(projectPath)) || "./"

        //folder path must be relative to project path
        if (!directoryPath) {
            relativeFolderPath = relativeProjectPath
            absoluteFolderPath = absoluteProjectPath
        } else {
            const isFolderPathAbsolute = path.isAbsolute(directoryPath)
            if (isFolderPathAbsolute && !absoluteProjectPath.includes(directoryPath)) {
                console.log(COLORS.FgRed("🐟! folder must be a sub directory of the project -- POP!"))
                process.exit(1)
            }
            relativeFolderPath = path.join((isFolderPathAbsolute ? directoryPath.split(absoluteProjectPath)[1] : directoryPath) || ".")
            absoluteFolderPath = (isFolderPathAbsolute ? directoryPath : path.join(absoluteProjectPath, relativeFolderPath)) || "./"
        }

        return {
            relativeFolderPath,
            relativeProjectPath,
            absoluteFolderPath,
            absoluteProjectPath
        }
    } catch (err) {
        console.log(COLORS.FgRed("🐟! you must provide valid path -- POP!"))
        process.exit(1)
    }
}

module.exports.resolveExcludedPaths = (options, absoluteFolderPath) => {
    const foldersToExclude = options.excludeDirs ? options.excludeDirs.split(",").map(f => path.join(absoluteFolderPath, f)) : []
    foldersToExclude.forEach(f => {
        if (!fs.existsSync(f)) {
            console.log(COLORS.FgRed("🐟! excluded directories must be sub-folder of the project/directory -- POP!"))
            process.exit(1)
        }
    })

    const filesToExclude = options.excludeFiles ? options.excludeFiles.split(",").map(f => path.join(absoluteFolderPath, f)) : []
    filesToExclude.forEach(f => {
        if (!fs.existsSync(f)) {
            console.log(f)
            console.log(COLORS.FgRed("🐟! excluded files must be inside the specified project/directory -- POP!"))
            process.exit(1)
        }
    })

    const acc = { files: [], dirs: [] }
    const array = options?.excludeHard || ""

    array
        .split(",")
        .filter(p => p)
        .map(p => path.join(absoluteFolderPath, p))
        .forEach(p => {
            if (fs.lstatSync(p).isDirectory()) acc.dirs.push(p)
            else acc.files.push(p)
        })
    const filesToExcludeHard = acc.files
    const foldersToExcludeHard = acc.dirs

    filesToExcludeHard.forEach(f => {
        if (!fs.existsSync(f)) {
            console.log(f)
            console.log(COLORS.FgRed("🐟! excluded files must be inside the specified project/directory -- POP!"))
            process.exit(1)
        }
    })

    foldersToExcludeHard.forEach(f => {
        if (!fs.existsSync(f)) {
            console.log(COLORS.FgRed("🐟! excluded directories must be sub-folder of the project/directory -- POP!"))
            process.exit(1)
        }
    })

    return {
        filesToExclude,
        foldersToExclude,
        filesToExcludeHard,
        foldersToExcludeHard
    }
}