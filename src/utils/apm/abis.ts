export const apmRegistryAbi = [
  'function newRepoWithVersion(string _name, address _dev, uint16[3] _initialSemanticVersion, address _contractAddress, bytes _contentURI) public returns (address)',
  'function CREATE_REPO_ROLE() view returns (bytes32)',
  'function canPerform(address, bytes32, uint256[]) external view returns (bool)',
  'event NewRepo(bytes32 id, string name, address repo)'
]

export const repoAbi = [
  'function newVersion(uint16[3] _newSemanticVersion, address _contractAddress, bytes _contentURI)',
  'function getLatest() public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
  'function getBySemanticVersion(uint16[3] _semanticVersion) public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
  'function CREATE_VERSION_ROLE() view returns (bytes32)',
  'function canPerform(address, bytes32, uint256[]) external view returns (bool)',
  'event NewVersion(uint256 versionId, uint16[3] semanticVersion)'
]

export const appStorageAbi = ['function kernel() public view returns (IKernel)']
