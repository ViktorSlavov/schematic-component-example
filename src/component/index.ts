import {
    Rule, Tree, SchematicsException,
    apply, url, applyTemplates, move,
    chain, mergeWith, externalSchematic, MergeStrategy, SchematicContext
} from '@angular-devkit/schematics';
import * as fs from 'fs';
import * as path from 'path';

import { strings, normalize, experimental } from '@angular-devkit/core';
import { ComponentOptions } from './component';
import { dasherize } from '@angular-devkit/core/src/utils/strings';


export function component(options: ComponentOptions): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const workspaceConfig = tree.read('/angular.json');
        // Check for angular.json - if not - throw error
        if (!workspaceConfig) {
            throw new SchematicsException('Could not find Angular workspace configuration');
        }

        const workspaceContent = workspaceConfig.toString();
        const workspace: experimental.workspace.WorkspaceSchema = JSON.parse(workspaceContent);
        if (!options.project) {
            options.project = workspace.defaultProject;
        }

        const projectName = options.project as string;
        const project = workspace.projects[projectName];
        const projectType = project.projectType === 'application' ? 'app' : 'lib';

        if (options.path === undefined) {
            options.path = `${project.sourceRoot}/${projectType}`;
        }
        if (!fs.existsSync(path.join(__dirname, `files/${options.type}`))) {
            throw new SchematicsException('Could not find component files')
        }
        const importPath = getImportPath(options.name);
        const outputPath = importPath.folder ?
            `${options.path}/${dasherize(importPath.folder)}/${importPath.fileName}`
            : `${options.path}/${importPath.fileName}`;
        const templateSource = apply(url(`./files/${options.type}`), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                name: importPath.fileName
            }),
            move(normalize(outputPath as string))
        ]);
        return chain([
            // Create a component using Angular's component schematic
            externalSchematic('@schematics/angular', 'component', { name: options.name }),
            // Apply custom templates, overwriting existing staged changes
            mergeWith(templateSource, MergeStrategy.Overwrite)
        ]);
    };
}

function getImportPath(path: string): { folder: string, fileName: string } {
    const split = path.split("/");
    const result = { fileName: split.splice(split.length - 1, 1)[0], folder: split.join('/') };
    return result;
}
