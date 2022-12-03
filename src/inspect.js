const path = require("path")
const fs = require("fs")

module.exports.getAllFilesInFolderAndSubfolder = (folder, formatsToInclude, foldersToExclude, filesToExclude) => {
    let filesToInspect = [];
    (function inspectDirectory(dirPath) {
        if (dirPath.endsWith("node_modules")) return
        if (foldersToExclude.includes(dirPath)) return
        
        const content = fs.readdirSync(dirPath)

        const elementsPaths = content.map(elem => path.join(dirPath, elem))

        let files = elementsPaths.filter(path => fs.lstatSync(path).isFile())

        files = files.filter(file => formatsToInclude
            .map(format => file.endsWith(format))
            .includes(true) && !filesToExclude.includes(file))

        filesToInspect.push(...files)

        const directories = elementsPaths.filter(path => fs.lstatSync(path).isDirectory())
            
        directories.forEach(dirPath => inspectDirectory(dirPath))
    })(folder)

    return filesToInspect
}