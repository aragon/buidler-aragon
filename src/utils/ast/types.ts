export interface AragonContractFunction {
  name: string
  notice: string
  paramTypes: string[]
  roles: { id: string; paramCount: number }[]
}
