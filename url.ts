
export function cleanUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const paramsToRemove = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'mc_cid',
      'mc_eid',
    ];

    const searchParams = url.searchParams;
    
    // Create a list of keys to delete to avoid modification during iteration
    const keysToDelete: string[] = [];
    searchParams.forEach((_, key) => {
        if (paramsToRemove.includes(key.toLowerCase())) {
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => searchParams.delete(key));

    return url.toString();
  } catch (error) {
    // If URL is invalid, return it as is.
    return urlString;
  }
}

export function getHostname(urlString: string): string {
  try {
    const url = new URL(urlString);
    // remove 'www.' from hostname to keep it clean
    return url.hostname.replace(/^www\./, '');
  } catch (error) {
    // Fallback for invalid URLs
    const parts = urlString.replace(/^(https?:\/\/)/, '').split('/');
    return parts[0];
  }
}
