// See https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#types
const SOLIDITY_TYPES = {
  address: 'address',
  bytes: 'bytes',
  uint: 'uint256',
  int: 'int256',
  ufixed: 'ufixed128x18',
  fixed: 'fixed128x18',
  bool: 'bool',
  string: 'string'
}

// In the all functions that accept the parameter `declaration` it referes
// to a string similar to the example below
//
// declaration = `/**
//  * @notice Increment the counter by `step`
//  * @param step Amount to increment by
//  */
// function increment(uint256 step) external auth(INCREMENT_ROLE)`

/**
 * Based on a function declaration string checks if modifies state and is public
 * @param declaration multiline function declaration with comments
 * @return false
 */
const modifiesStateAndIsPublic = (declaration: string): boolean =>
  !declaration.match(/\b(internal|private|view|pure|constant)\b/)

/**
 * Check if the type starts with any of the basic types, otherwise it is probably
 * a typed contract, so we need to return address for the signature
 * @param type "address" | "ERC20ContractInstance"
 * @return "address"
 */
const typeOrAddress = (type: string): string =>
  Object.keys(SOLIDITY_TYPES).some(t => type.startsWith(t)) ? type : 'address'

/**
 * Expand shorthands into their full types for calculating function signatures
 * @param type "uint"
 * @return "uint256"
 */
const expandTypeForSignature = (type: string): string =>
  type in SOLIDITY_TYPES ? SOLIDITY_TYPES[type] : type

/**
 * extracts function signature from function declaration
 * @param declaration multiline function declaration with comments
 */
function getSignature(declaration: string): string {
  const declarationMatch = declaration.match(/^\s*function ([^]*?)\)/m)
  if (!declarationMatch) return ''

  const [name, params] = declarationMatch[1].split('(')

  if (!name) {
    return 'fallback'
  }

  if (params) {
    // Has parameters
    const parsedParams = params
      .replace(/\n/gm, '')
      .replace(/\t/gm, '')
      .split(',')
      .map(param => param.split(' ').filter(s => s.length > 0)[0])
      .map(type => typeOrAddress(type))
      .map(type => expandTypeForSignature(type))
      .join(',')

    return `${name}(${parsedParams})`
  }

  return `${name}()`
}

/**
 * Get notice from function declaration
 * @param declaration multiline function declaration with comments
 */
function getNotice(declaration: string): string {
  // capture from @notice to either next '* @' or end of comment '*/'
  const notices = declaration.match(/(@notice)([^]*?)(\* @|\*\/)/m)
  if (!notices || notices.length === 0) return ''

  return notices[0]
    .replace('*/', '')
    .replace('* @', '')
    .replace('@notice ', '')
    .replace(/\n/gm, '')
    .replace(/\t/gm, '')
    .split(' ')
    .filter(x => x.length > 0)
    .join(' ')
}

/**
 * Extracts relevant function information from their source code
 * Only returns functions that are state modifying
 * @param sourceCode Full solidity source code
 * @return [{
 *   signature: "baz(uint32,bool)",
 *   notice: "Sample radspec documentation..."
 * }, ... ]
 */
export function parseFunctionsNotices(
  sourceCode: string
): {
  /**
   * signature: "baz(uint32,bool)"
   */
  signature: string
  /**
   * notice: "Sample radspec documentation..."
   */
  notice: string
}[] {
  // Everything between every 'function' and '{' and its @notice.
  const functionDeclarations =
    sourceCode.match(/(@notice|^\s*function)(?:[^]*?){/gm) || []

  return functionDeclarations
    .filter(functionDeclaration =>
      modifiesStateAndIsPublic(functionDeclaration)
    )
    .map(functionDeclaration => ({
      signature: getSignature(functionDeclaration),
      notice: getNotice(functionDeclaration)
    }))
}
