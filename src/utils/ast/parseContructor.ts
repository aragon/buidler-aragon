import * as parser from '@solidity-parser/parser'

/**
 * Returns true if a contract has a constructor, otherwise false.
 *
 * @param sourceCode Source code of the contract.
 */
export function hasConstructor(sourceCode: string): boolean {
  const ast = parser.parse(sourceCode, {})
  let foundConstructor = false

  parser.visit(ast, {
    FunctionDefinition: function(node) {
      if (!node.isConstructor) return
      foundConstructor = true
    }
  })

  return foundConstructor
}
