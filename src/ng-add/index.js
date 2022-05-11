"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.netlifyBuilder = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
function getWorkspace(host) {
    const possibleFiles = ['/angular.json', './angular.json'];
    const path = possibleFiles.find(path => host.exists(path));
    const configBuffer = path ? host.read(path) : undefined;
    if (!path || !configBuffer) {
        throw new schematics_1.SchematicsException(`Could not find angular.json`);
    }
    const content = configBuffer.toString();
    let workspace;
    try {
        workspace = core_1.parseJson(content, core_1.JsonParseMode.Loose);
    }
    catch (e) {
        throw new schematics_1.SchematicsException(`Could not parse angular.json: ${e.message}`);
    }
    return { path, workspace };
}
function netlifyBuilder(options) {
    return (tree, _context) => {
        // get the workspace details
        const { path: workspacePath, workspace } = getWorkspace(tree);
        // getting project name
        if (!options.project) {
            if (workspace.defaultProject) {
                options.project = workspace.defaultProject;
            }
            else {
                throw new schematics_1.SchematicsException('No Angular project selected and no default project in the workspace');
            }
        }
        // Validating project name
        const project = workspace.projects[options.project];
        if (!project) {
            throw new schematics_1.SchematicsException('The specified Angular project is not defined in this workspace');
        }
        // Checking if it is application
        if (project.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`Deploy requires an Angular project type of "application" in angular.json`);
        }
        // Getting output path from Angular.json
        if (!project.architect ||
            !project.architect.build ||
            !project.architect.build.options ||
            !project.architect.build.options.outputPath) {
            throw new schematics_1.SchematicsException(`Cannot read the output path(architect.build.options.outputPath) of the Angular project "${options.project}" in angular.json`);
        }
        // adding deploy statement for builder
        project.architect['deploy'] = {
            "builder": "@netlify-builder/deploy:deploy",
            "options": {
                "outputPath": project.architect.build.options.outputPath,
                "netlifyToken": options.netlifyToken,
                "siteId": options.siteID,
            }
        };
        tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
        return tree;
    };
}
exports.netlifyBuilder = netlifyBuilder;
function default_1(options) {
    return schematics_1.chain([
        netlifyBuilder(options),
    ]);
}
exports.default = default_1;
//# sourceMappingURL=index.js.map