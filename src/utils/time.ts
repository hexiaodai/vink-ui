export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => window.setTimeout(() => { resolve() }, ms))
}
