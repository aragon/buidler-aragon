/**
 * The purpose of this file is to control the order in which tests are run
 * There is an unresolved issue where if the big start task test
 * is not run first it will break because the this.env is not configured ok
 */

import './src/tasks/start-task.test'
