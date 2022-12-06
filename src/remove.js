const COLORS = require("./colors")
const child = require("node:child_process")

module.exports.removeDependencies = (packageJsonPath, dependencies, packageManager) => {
    if (!dependencies[0]) return 

    packageJsonPath = packageJsonPath.split("package.json")[0]

    let errors = []

    dependencies.forEach(dep => {
        process.stdout._write(COLORS.FgRed("🐟: removing     ") + dep)

        let isRemoved = false
        try {
            switch (packageManager) {
                case "npm":
                    isRemoved = execRemoveDependencyCommand(`npm --prefix ${packageJsonPath} remove ${dep}`)
                    break
                case "yarn":
                    isRemoved = execRemoveDependencyCommand(`yarn remove --cwd ${packageJsonPath} ` + dep)
                    break
                default:
                    console.log(COLORS.FgRed(" ❌"))
                    console.log(COLORS.FgRed("\n🐟! error: unknown package manager: " + packageManager))
                    console.log(COLORS.FgRed("🐟! aborting.") + "\n")
                    process.exit(1)
            }

            if (isRemoved) process.stdout._write(COLORS.FgGreen(" ✓\n" ))
            else {
                process.stdout._write(COLORS.FgRed(" ❌\n"))
                errors.push(dep)
            }

        } catch (error) { }
    })

    if (errors[0]) {
        console.log(COLORS.FgRed("\n\n🐟: failed:\t")+ errors.join(", ") + "\n")
        console.log(COLORS.FgYellow(`🐟: HINT: try specific ${packageManager} commands to fix errors`))
    }

    console.log()
}

const execRemoveDependencyCommand = (cmd) => {
    try {
        child.execSync(cmd, { stdio: "pipe" })
        return true
    } catch (err) {
        return false
    }
}

module.exports.removeFile = (filePath, absFolderPath) => {
    try {
        process.stdout._write(COLORS.FgRed("🐟: removing     ") + "." + filePath.split(absFolderPath)[1])
        child.execSync("rm -f " + filePath, { stdio: "pipe" })
        process.stdout._write(COLORS.FgGreen(" ✓\n" ))
    } catch (err) {
        process.stdout._write(COLORS.FgRed("❌\n"))
        throw err
    }
}


