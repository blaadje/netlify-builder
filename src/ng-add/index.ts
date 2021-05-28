import { Rule, SchematicContext, SchematicsException, Tree, chain } from '@angular-devkit/schematics';
import {  JsonParseMode, parseJson } from '@angular-devkit/core';
import { Workspace } from '../interfaces';

function getWorkspace(host: Tree): { path: string; workspace: Workspace } {
    const possibleFiles = ['/angular.json', './angular.json'];
    const path = possibleFiles.find(path => host.exists(path));
    const configBuffer = path ? host.read(path) : undefined;

    if (!path || !configBuffer) {
        throw new SchematicsException(`Could not find angular.json`);
    }

    const content = configBuffer.toString();
    let workspace: Workspace;

    try {
        workspace = (parseJson(content, JsonParseMode.Loose) as {}) as Workspace;
    } catch (e) {
        throw new SchematicsException(`Could not parse angular.json: ${e.message}`);
    }

    return { path, workspace };
}

interface NgAddOptions {
    project?: string;
    siteID: string;
    netlifyToken: string;
}

export function netlifyBuilder(options: NgAddOptions): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        // get the workspace details
        const { path: workspacePath, workspace } = getWorkspace(tree);

        // getting project name
        if (!options.project) {
            if (workspace.defaultProject) {
                options.project = workspace.defaultProject;
            } else {
                throw new SchematicsException(
                    'No Angular project selected and no default project in the workspace'
                );
            }
        }

        // Validating project name
        const project = workspace.projects[options.project];
        if (!project) {
            throw new SchematicsException(
                'The specified Angular project is not defined in this workspace'
            );
        }

        // Checking if it is application
        if (project.projectType !== 'application') {
            throw new SchematicsException(
                `Deploy requires an Angular project type of "application" in angular.json`
            );
        }

        // Getting output path from Angular.json
        if (
            !project.architect ||
            !project.architect.build ||
            !project.architect.build.options ||
            !project.architect.build.options.outputPath
        ) {
            throw new SchematicsException(
                `Cannot read the output path(architect.build.options.outputPath) of the Angular project "${options.project}" in angular.json`
            );
        }

        // adding deploy statement for builder
        project.architect['deploy'] = {
            "builder": "@netlify-builder/deploy:deploy",
            "options": {
                "outputPath": project.architect.build.options.outputPath,
                "netlifyToken": options.netlifyToken,
                "siteId": options.siteID,
            }
        }

        tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
        return tree;
    };
}

export default function (options: NgAddOptions): Rule {
    return chain([
        netlifyBuilder(options),
    ]);
}