export function mapSortString(sortString: string): Record<string, 1 | -1> {
  return sortString.split(",").reduce((accu, field) => {
    if (field.startsWith("-")) {
      return { ...accu, [field.substring(1)]: -1 };
    }
    return { ...accu, [field]: 1 };
  }, {});
}
