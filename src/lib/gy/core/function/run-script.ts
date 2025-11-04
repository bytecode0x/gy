import vm from 'vm';

export async function runScript({ code, params }: { code: string; params: Record<string, any> }) {
  return new Promise<any>(function (resolve, reject) {
    const coverup = {
      window: undefined,
      document: undefined,
      // global: undefined,
      globalThis: undefined,
      require: undefined,
      __filename: undefined,
      __dirname: undefined,
      evHandler: undefined,
      eval: undefined,
      Function: undefined,
      AsyncFunction: undefined,
      __reject__: reject
    }

    const sandbox = { ...coverup, ...params }

    //   @return — the result of the very last statement executed in the script.
    const script = new vm.Script(`
    async function f() {
      ${code.trim()}
    }

    // this swallows up error
    // f().catch((err) => __reject__(err))
    f()
  `)
    const contextified = vm.createContext(sandbox)

    resolve(script.runInContext(contextified, { timeout: 1000 * 30 }))
  })
}
