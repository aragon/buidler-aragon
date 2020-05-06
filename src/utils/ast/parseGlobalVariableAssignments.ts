import * as parser from '@solidity-parser/parser'

/**
 * Finds global storage variable declarations with initialized values, e.g 'int a = 1'.
 *
 * @param sourceCode Source code of the contract.
 */
export function parseGlobalVariableAssignments(sourceCode: string): string[] {
  const ast = parser.parse(sourceCode, {})
  const variables: string[] = []
  parser.visit(ast, {
    StateVariableDeclaration: function(node) {
      const variable = node.variables[0]
      if (
        variable.isStateVar &&
        !variable.isDeclaredConst &&
        variable.expression
      ) {
        variables.push(variable.name)
      }
    }
  })
  return variables
}
