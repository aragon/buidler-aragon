export const apmRegistryAbi = [
  'function newRepoWithVersion(string _name, address _dev, uint16[3] _initialSemanticVersion, address _contractAddress, bytes _contentURI) public returns (address)',
  'event NewRepo(bytes32 id, string name, address repo)'
]

export const repoAbi = [
  'function newVersion(uint16[3] _newSemanticVersion, address _contractAddress, bytes _contentURI)',
  'event NewVersion(uint256 versionId, uint16[3] semanticVersion)',
  'function getLatest() public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
  'function getBySemanticVersion(uint16[3] _semanticVersion) public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)'
]

export const appStorageAbi = ['function kernel() public view returns (IKernel)']
