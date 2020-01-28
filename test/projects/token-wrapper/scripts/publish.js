#!/usr/bin/env node

const ACCEPTED_VERSIONS = ['major', 'minor', 'patch']

const execute = require('child_process').execSync

// First two args are node and this script
const version = process.argv[2] || ''
const extraArgs = process.argv.slice(3).join(' ')

if (!ACCEPTED_VERSIONS.includes(version)) {
  console.log(`Publish requires a valid version bump (one of '${ACCEPTED_VERSIONS.join(', ')}'). Given '${version}'.`)
  console.log('Usage: publish <version bump> <extra arguments>')
  return
}

const publishCommand = `aragon apm publish ${version} --files dist/ --prepublish-script apm:prepublish ${extraArgs}`
console.log(`Running: ${publishCommand}`)
execute(publishCommand, { stdio: 'inherit' })
