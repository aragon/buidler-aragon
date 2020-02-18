import { compilerOptions } from './tsconfig.json'
import { register } from 'tsconfig-paths'
import { join } from 'path'

const baseUrl = join(__dirname, './')
register({
  baseUrl,
  paths: compilerOptions.paths
})
