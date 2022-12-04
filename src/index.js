
const fs = require("fs");
const path = require("path")
const { Command } = require('commander')
const COLORS = require("./colors")
const { name, version } = require("../package.json")
const { checkDependeciesUsageForEachFile } = require("./check")
const { getAllFilesInFolderAndSubfolder } = require("./inspect")
const { removeDependencies } = require("./remove");
const { resolveMainPaths, resolveExcludedPaths } = require("./path")
const { askQuestion } = require("./question")
const { formats, defaultIgnored, defaultIgnoredDirs } = require("./constants")

const printTitle = () => console.log("\n" + COLORS.BgYellow(COLORS.FgMagenta(COLORS.Bright(` Cleanerfish v${version} `))) + "\n")

const program = (new Command()).name(name)

program
    .command("clean [project-path]")
    .option('-y, --yes-mode', "yes mode (no confirmation required)")
    .option("-i, --ignore <string>", "ignore list of packages (coma-separated)")
    .option('-f, --folder <string>', "specify a folder to inspect (must be a sub-folder of the project)")
    .option('-f, --file <string>', "specify a file to inspect (must be inside the project/directory)")
    .option('--exclude-dirs <string>', "specify a comma-separated list of directories to exclude (must be sub-folder of the project/directory)")
    .option('--exclude-files <string>', "specify a comma-separated list of files to exclude (must be inside the project/directory)")
    .option('-c, --comments', "considers commented imports as valid (false by default)")
    .option("-o, --optional", "include optionalDependencies (false by default)")
    .option("-d, --dev", "include devDependencies (false by default)")
    .option("--prevent-defaults", "prevent default ignored packages from being skipped (false by default)")
    .option('--yarn', "use yarn instead of npm")
    .action(async (projectPath, options) => {
        printTitle()

        if (!projectPath) projectPath = process.cwd()

        const {
            absoluteFolderPath,
            absoluteProjectPath,
            relativeFolderPath,
            relativeProjectPath
        } = resolveMainPaths(projectPath, options.folder)

        console.log(COLORS.FgCyan("🐟: cwd         "), process.cwd())
        console.log(COLORS.FgCyan("🐟: project     "), relativeProjectPath)
        console.log(COLORS.FgCyan("🐟: folder      "), relativeFolderPath)

        //get dependingies and filter ignore list
        const packageJsonPath = path.join(absoluteProjectPath, "package.json")
        const packageJson = require(packageJsonPath)
        const dependenciesToIgnore = options.ignore?.split(",").map(d => d.trim()) || []
        const dependencies = Object.keys(packageJson.dependencies || {})
        const devDependencies = options.dev ? Object.keys(packageJson.devDependencies || {}) : []
        const optionalDependencies = options.optional ? Object.keys(packageJson.optionalDependencies || {}) : []
        const dependenciesToCheck = [...new Set(Object.values({
            dependencies,
            devDependencies,
            optionalDependencies,
        }).flat())].filter(d => !dependenciesToIgnore.includes(d)).sort()

        console.log(COLORS.FgCyan("🐟: ignored      ") + dependenciesToIgnore.join(", "))
        console.log(COLORS.FgCyan("🐟: addressed    ") + dependenciesToCheck.join(", ") + "\n")

        //inspect folder files and list dependencies
        const {foldersToExclude, filesToExclude} = resolveExcludedPaths(options, absoluteFolderPath)
        const filesToInspect = getAllFilesInFolderAndSubfolder(absoluteFolderPath, formats, foldersToExclude, filesToExclude)
        const dependenciesByFile = checkDependeciesUsageForEachFile(dependenciesToCheck, filesToInspect, absoluteProjectPath)

        //find unused dependencies
        const usedDependencies = [...new Set(Object.values(dependenciesByFile).flat())]
        const unusedDependencies = dependenciesToCheck.filter(x => !usedDependencies.includes(x)).sort();
        console.log(COLORS.FgRed("🐟: unused       ") + (unusedDependencies[0] ? unusedDependencies.join(", ") : "no unused dependecies") + "\n")

        //remove unused dependencies
        const packageManager = options.yarn ? "yarn" : "npm"
        if (unusedDependencies[0]) {
            if (options.yesMode) {
                removeDependencies(packageJsonPath, unusedDependencies, packageManager)
            } else {
                for (let dep of unusedDependencies) {
                    let flag = ""
                    if (devDependencies.includes(dep)) flag = ` (dev)`
                    if (optionalDependencies.includes(dep)) flag = ` (opt)`
                    const response = await askQuestion(COLORS.FgYellow(`🐟? remove ${dep}${flag}?`) + " (y/n) ")
                    if (["y", "Y"].includes(response)) removeDependencies(packageJsonPath, [dep], packageManager)
                }
            }
        }

        process.stdout._write(COLORS.FgGreen(`🐟: done.\n`))
    })


program.command("defaults")
    .action(() => {
        printTitle()
        console.log(COLORS.FgCyan(`🐟: default ignored directories`))
        console.log("   ", defaultIgnoredDirs.sort().join(", "))
        console.log(COLORS.FgCyan(`\n🐟: default ignored packages`))
        console.log("   ", defaultIgnored.sort().join(", "))
        console.log(COLORS.FgYellow(`\n🐟! consider putting them in devDependencies\n    and using the --prevent-defaults flag as\n    best practise`))
    })

module.exports = program

