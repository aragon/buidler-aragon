import semver from 'semver'

type SemverBump = 'patch' | 'minor' | 'major'
const bumps: SemverBump[] = ['patch', 'minor', 'major']

/**
 * Parse and validate a string that may be a semver bump or version
 * given a previous version returns the bump type and next version
 * or throws an error if the combination is not valid
 * For first releases, set prevVersion to undefined
 * @param bumpOrVersion
 * @param prevVersion
 */
export default function parseAndValidateBumpOrVersion(
  bumpOrVersion: string,
  prevVersion = '0.0.0'
): { bump: SemverBump; nextVersion: string } {
  if (!semver.valid(prevVersion)) throw Error('Previous version must be valid')

  if (bumps.includes(bumpOrVersion as SemverBump)) {
    // case bumpOrVersion = bump
    const bump = bumpOrVersion as SemverBump
    const nextVersion = semver.inc(prevVersion, bump)
    if (!nextVersion) throw Error(`Invalid bump ${bump}`)
    return {
      bump,
      nextVersion
    }
  } else if (semver.valid(bumpOrVersion)) {
    // case bumpOrVersion = version
    const nextVersion = bumpOrVersion

    // Make sure nextVersion is clean, forbid "v0.2.0-beta.1"
    if (!isSemverClean(nextVersion))
      throw Error(`next version must be a simple semver: ${nextVersion}`)

    // No need to call the APM Repo smart contract isValidBump function
    // since it does exactly the same logic as below
    for (const bump of bumps)
      if (semver.inc(prevVersion, bump) === nextVersion)
        return {
          bump,
          nextVersion
        }

    throw Error(`Invalid bump from ${prevVersion} to ${nextVersion}`)
  } else {
    // invalid case
    throw Error(
      `Must provide a valid bump or valid semantic version: ${bumpOrVersion}`
    )
  }
}

/**
 * Return true if version is a simple semver: "0.2.0"
 * Versions: "v0.2.0", "0.2.0-beta.1", "0.2.0.1" will return false
 * @param version
 */
function isSemverClean(version: string): boolean {
  const coercedSemver = semver.coerce(version)
  return Boolean(coercedSemver && coercedSemver.version === version)
}
