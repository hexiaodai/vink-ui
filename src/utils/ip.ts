export const extractIPFromCIDR = (cidrString?: string): string => {
    if (!cidrString) {
        return ''
    }
    const [ip, _] = cidrString.split('/')
    return ip
}
