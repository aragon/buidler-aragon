export async function assertRevert(
  promise: Promise<any>,
  expectedErrorMessage: string
): Promise<void> {
  return new Promise(resolve => {
    promise
      .then(() => {
        throw new Error(
          `Promise was expected to fail with ${expectedErrorMessage}, but did not fail.`
        )
      })
      .catch(error => {
        if (error.message.includes(expectedErrorMessage)) {
          resolve()
        } else {
          throw new Error(
            `Promise was expected to fail with ${expectedErrorMessage}, but failed with ${error.message} instead.`
          )
        }
      })
  })
}
