import {
    Rule, Tree, SchematicsException,
    apply, url, applyTemplates, move,
    chain, mergeWith, externalSchematic, MergeStrategy, SchematicContext
} from '@angular-devkit/schematics';

import { strings, normalize } from '@angular-devkit/core';
import { ComponentOptions } from './schema';
import { WorkspaceSchema } from '@angular-devkit/core/src/experimental/workspace';


export function component(options: ComponentOptions): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        if (!tree.exists('/angular.json')) {
            throw new SchematicsException('Could not find Angular workspace configuration');
        }

        const workspaceContent = tree.read('/angular.json')!.toString();
        const workspace: WorkspaceSchema = JSON.parse(workspaceContent);

        if (!workspace.defaultProject) {
            throw new SchematicsException('Could not find default project!');
        }
        const project = workspace.projects[workspace.defaultProject];
        const outputPath = `${project.sourceRoot}/${project.prefix}/${options.name}`;

        // Create a separate Source from the specified templates
        const templateSource = apply(url(`./files/${options.type}`), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                name: options.name
            }),
            move(normalize(outputPath))
        ]);


        return chain([
            // Create a component using Angular's component schematic
            externalSchematic('@schematics/angular', 'component', { name: options.name }),
            // Apply custom templates, overwriting existing staged changes
            mergeWith(templateSource, MergeStrategy.Overwrite)
        ]);
    };
}
