export function getAuthIdFromJwtClaim(_evt) {
  return _evt?.requestContext?.authorizer?.jwt?.claims?.sub;
}
