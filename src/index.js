const path = require("path")
const readline = require('readline');
const { Command } = require('commander')
const COLORS = require("./colors")
const { name, version } = require("../package.json")
const { checkDependeciesUsageForEachFile } = require("./check")
const { getAllFilesInFolderAndSubfolder } = require("./inspect")
const { removeDependencies } = require("./remove");
const fs = require("fs");

const formats = ["js", "cjs", "ts", "cts", "mjs"] //TODO complete list

module.exports = (new Command()).name(name)
    .argument("[project-path]", undefined, process.cwd())
    .option('-y, --yes-mode', "yes mode (no confirmation required)")
    .option("-i, --ignore <string>", "ignore list of packages (coma-separated)")
    .option('-d, --directory <string>', "specify a folder to inspect (must be a sub-folder of the project)")
    .option('-f, --file <string>', "specify a file to inspect (must be inside the project/directory)")
    .option('--exclude-dirs <string>', "specify a coma-separated list of directories to exclude (must be sub-folder of the project/directory)")
    .option('--exclude-files <string>', "specify a coma-separated list of files to exclude (must be inside the project/directory)")
    .option("-o, --optional", "include optionalDependencies")
    .option("-d, --dev", "include devDependencies")
    .option('--yarn', "use yarn instead of npm")
    .action(async (projectPath, options) => {
        console.log("\n" + COLORS.BgYellow(COLORS.FgMagenta(COLORS.Bright(` Cleanerfish v${version} `))) + "\n")
        console.log(COLORS.FgCyan("🐟: cwd         "), process.cwd())

        let relativeProjectPath
        let absoluteProjectPath
        let relativeFolderPath
        let absoluteFolderPath

        let folderPath
        try {
            //project path must be relative to process execution
            const isProjectPathAbsolute = path.isAbsolute(projectPath)
            relativeProjectPath = (isProjectPathAbsolute ? projectPath.split(process.cwd())[0] : projectPath) || "./"
            absoluteProjectPath = (isProjectPathAbsolute ? projectPath : path.resolve(projectPath)) || "./"

            //folder path must be relative to project path
            if (!options.directory) {
                relativeFolderPath = relativeProjectPath
                absoluteFolderPath = absoluteProjectPath
            } else {
                const isFolderPathAbsolute = path.isAbsolute(options.directory)
                if (isFolderPathAbsolute && !absoluteProjectPath.includes(options.directory)) {
                    console.log(COLORS.FgRed("🐟! folder must be a sub directory of the project -- POP!"))
                    process.exit(1)
                }
                relativeFolderPath = path.join((isFolderPathAbsolute ? options.directory.split(absoluteProjectPath)[1] : options.directory) || ".")
                absoluteFolderPath = (isFolderPathAbsolute ? folderPath : path.join(absoluteProjectPath, relativeFolderPath)) || "./"
            }
        } catch (err) {
            console.log(COLORS.FgRed("🐟! you must provide valid path -- POP!"))
            process.exit(1)
        }

        console.log(COLORS.FgCyan("🐟: project     "), relativeProjectPath)
        console.log(COLORS.FgCyan("🐟: folder      "), relativeFolderPath)

        //get dependingies and filter ignore list
        const packageJsonPath = path.join(absoluteProjectPath, "package.json")
        const packageJson = require(packageJsonPath)
        const dependenciesToIgnore = options.ignore?.split(",").map(d => d.trim()) || []
        const dependenciesToCheck = [...new Set(Object.values({
            dependencies: Object.keys(packageJson.dependencies || {}),
            devDependencies: options.dev ? Object.keys(packageJson.devDependencies || {}) : [],
            optionalDependencies: options.optional ? Object.keys(packageJson.optionalDependencies || {}) : [],
        }).flat())].filter(d => !dependenciesToIgnore.includes(d))

        console.log(COLORS.FgCyan("🐟: ignored      ") + dependenciesToIgnore.join(", "))
        console.log(COLORS.FgCyan("🐟: addressed    ") + dependenciesToCheck.join(", ") + "\n")

        //inspect folder files and list dependencies
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
        const filesToInspect = getAllFilesInFolderAndSubfolder(absoluteFolderPath, formats, foldersToExclude, filesToExclude)
        const dependenciesByFile = checkDependeciesUsageForEachFile(dependenciesToCheck, filesToInspect, absoluteProjectPath)

        //find unused dependencies
        const usedDependencies = [...new Set(Object.values(dependenciesByFile).flat())]
        const unusedDependencies = dependenciesToCheck.filter(x => !usedDependencies.includes(x));
        console.log(COLORS.FgRed("🐟: unused       ") + (unusedDependencies[0] ? unusedDependencies.join(", ") : "no unused dependecies") + "\n")

        //remove unused dependencies
        const packageManager = options.yarn ? "yarn" : "npm"
        if (unusedDependencies[0]) {
            if (options.yesMode) {
                removeDependencies(packageJsonPath, unusedDependencies, packageManager)
            } else {
                for (let dep of unusedDependencies) {
                    const response = await askQuestion(COLORS.FgYellow(`🐟? remove ${dep}?`) + " (y/n) ")
                    if (["y", "Y"].includes(response)) removeDependencies(packageJsonPath, [dep], packageManager)
                }
            }
        }

        process.stdout._write(COLORS.FgGreen(`🐟: done.\n`))
    })


function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}


function prtintGlobalHelp() {
    console.log("usage:")
    console.log(`cleanerfish <project-path [default=./]> <folder-path [default=project-path]> ..options\n`)
    prtintOptionsHelp()
}

function prtintOptionsHelp() {
    console.log("options:")
    console.log("  -y                                   yes mode (no confirmation required)")
    console.log("  --yarn                               use yarn instead of npm")
    console.log("  -i --ignore <package1,package2,..>   ignore list of packages (coma-separated)")
}

process.on("exit", () => console.log())

