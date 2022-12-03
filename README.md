# Cleanerfish

## About Cleanerfish
Cleanerfish is your new favourite utility to **cleanup** your *node.js* projects from **actually unused dependencies**!

Cleanerfish is not the usual boring and ineffective *npm prune*. Insteat it **actually scans your project** to seek dependencies that are not imported/required, but are present in your *package.json* and *node_modules*, then removes them!

Cleanerfish is compatible with both **npm** and **yarn** package managers.


## Cleanerfish Installation
```
npm instal -g cleanerfish
```

## Cleanerfish Usage  
### Safe mode (confirmation required)
```
cleanerfish
```

### Automatic mode (no confirmation required)
```
cleanerfish -y
```

### Different project path
```
cleanerfish /path/to/my/project 
```
### Inspect specific folder
```
cleanerfish -f /path/to/folder 
```


### Use yarn instead of npm
```
cleanerfish --yarn
```

### All options
```
-y, --yes-mode              yes mode (no confirmation required)
-d, --directory <string>    specify a folder to inspect (must be a sub-folder of the project)
-e, --exclude-dir <string>  specify a coma-separated list of directories to exclude (must be sub-folder of the project/directory)
--yarn                      use yarn instead of npm
-i, --ignore <string>       ignore list of packages (coma-separated)
-d, --dev                   include devDependencies
-o, --optional              include optionalDependencies
-h, --help                  display help for command
```

