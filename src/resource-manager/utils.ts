export const generateSelector = (advancedParams: any) => {
    return advancedParams?.params?.keyword
        ? `metadata.${advancedParams.searchFilter}=${advancedParams.params.keyword}`
        : ""
}
