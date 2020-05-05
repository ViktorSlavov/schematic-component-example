import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export default function migration1(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _context.logger.info('Thanks for using schematics!');
    return tree;
  };
}