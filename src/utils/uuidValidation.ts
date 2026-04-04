/**
 * Validates if a string is a valid UUID format
 * Guards against undefined, null, the string "undefined", and invalid UUID formats
 */
export const isValidUUID = (id: string | undefined | null): id is string => {
  if (!id || id === 'undefined' || id === 'null') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
