export const PROFILE_PICTURES_BUCKET = "profile-pictures";

export const createAvatarPath = (userId: string) =>
  `${userId}/avatar-${Date.now()}.jpg`;

export const getAvatarStoragePath = (
  avatarUrl: string | null | undefined,
): string | null => {
  if (!avatarUrl) return null;

  try {
    const url = new URL(avatarUrl);
    const pathname = decodeURIComponent(url.pathname);
    const publicMarker = `/object/public/${PROFILE_PICTURES_BUCKET}/`;
    const publicIndex = pathname.indexOf(publicMarker);

    if (publicIndex >= 0) {
      return pathname.slice(publicIndex + publicMarker.length);
    }

    const authenticatedMarker = `/object/authenticated/${PROFILE_PICTURES_BUCKET}/`;
    const authenticatedIndex = pathname.indexOf(authenticatedMarker);

    if (authenticatedIndex >= 0) {
      return pathname.slice(authenticatedIndex + authenticatedMarker.length);
    }

    return null;
  } catch {
    // Fall through for legacy values that may already be storage paths.
  }

  const cleanedPath = avatarUrl.split("?")[0].replace(/^\/+/, "");

  if (cleanedPath.startsWith(`${PROFILE_PICTURES_BUCKET}/`)) {
    return cleanedPath.slice(PROFILE_PICTURES_BUCKET.length + 1);
  }

  if (cleanedPath.includes("/")) {
    return cleanedPath;
  }

  return null;
};
