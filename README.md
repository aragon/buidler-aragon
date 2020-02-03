# buidler-aragon

_WIP - Experimental!_

Buidler plugin for developing Aragon apps with full front end and back end hot reloading.

## Usage

To use this plugin, please use [**create-aragon-app**](https://www.npmjs.com/package/create-aragon-app) with the buidler boilerplate option. For instructions on how to use this boilerplate, please refer to [**aragon-buidler-boilerplate**](https://github.com/aragon/aragon-buidler-boilerplate).

If you don't want to use a create-aragon-app or a boilerplate, you can follow the structure of the boilerplate linked above. In essence, the regular structure of a Buidler project should do. Please refer to the [**Buidler docs**](https://buidler.dev/). Make sure that you are requireing the plugin in your Buidler configuration file:

```
usePlugin('@aragon/buidler-aragon')
```

### Tasks
# TODO

### Configuration

This plugin extends BuidlerConfig by adding the following fields:

```
export interface AragonConfig {
  appServePort?: number
  clientServePort?: number
  appSrcPath?: string
  appBuildOutputPath?: string
  hooks?: AragonConfigHooks
}
```

### Hooks

If you need to perform some tasks before deploying your application's proxy, i.e. deploying a token and passing that token in your proxy's initialize function, you can use the hooks object within the BuidlerConfig object. This object simply contains functions, which, if named correctly, will be called at the appropriate moments in the development pipeline:

```
export interface AragonConfigHooks {
  preDao?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  postDao?: (
    dao: KernelInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  preInit?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  postInit?: (
    proxy: Truffle.ContractInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  getInitParams?: (bre: BuidlerRuntimeEnvironment) => Promise<any[]> | any[]
  postUpdate?: (
    proxy: Truffle.ContractInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
}
```

For an example on how to use these hooks, please see the [**token-wrapper tests**](https://github.com/aragon/buidler-aragon/blob/master/test/projects/token-wrapper/scripts/hooks.js) within the plugin's test projects.

## Development

Please refer to the [**Buidler docs**](https://buidler.dev/advanced/building-plugins.html) for plugin development.

After cloning this repository, make sure you run `npm run dev` so that all required contract artifacts are available.
