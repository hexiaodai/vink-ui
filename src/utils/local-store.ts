class LocalStorage {
    static store(key: string, value: any): void {
        try {
            const serializedValue = JSON.stringify(value)
            window.localStorage.setItem(key, serializedValue)
        } catch (error) {
            console.error('Error storing data to localStorage: ', error)
        }
    }

    static load<T>(key: string, defaultValue: T): T {
        try {
            const serializedValue = window.localStorage.getItem(key)
            if (serializedValue === null) {
                return defaultValue
            }
            return JSON.parse(serializedValue) as T
        } catch (error) {
            console.error('Error loading data from localStorage: ', error)
            return defaultValue
        }
    }
}

export default LocalStorage
