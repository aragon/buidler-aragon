import { flatten, uniqBy } from 'lodash'
import { Role } from '~/src/types'
import { AragonContractFunction } from '~/src/utils/ast'

interface RoleMatchError {
  id: string
  message: string
}

/**
 * Verifies that the roles used in the contract match the ones
 * defined in a roles array, from arapp.json.
 * Returns JSON data so the consumer can choose to show a warning or throw
 * @param functions
 * @param roles
 */
export function matchContractRoles(
  functions: AragonContractFunction[],
  roles: Role[]
): RoleMatchError[] {
  const errors: RoleMatchError[] = []
  const addError = (id: string, message: string): void => {
    errors.push({ id, message })
  }

  const contractRoles = uniqBy(
    flatten(functions.map(fn => fn.roles)),
    role => role.id
  )

  for (const role of roles) {
    const paramCount = (role.params || []).length
    const contractRole = contractRoles.find(({ id }) => id === role.id)
    if (!contractRole) addError(role.id, 'Role not used in contract')
    else if (paramCount !== contractRole.paramCount)
      addError(
        role.id,
        `Role has ${paramCount} declared params but contract uses ${contractRole.paramCount}`
      )
  }

  for (const contractRole of contractRoles) {
    const role = roles.find(({ id }) => id === contractRole.id)
    if (!role) addError(contractRole.id, 'Role not declared in arapp')
  }

  return errors
}
