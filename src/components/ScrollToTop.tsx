import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * React Router keeps the window scroll offset across navigations, so moving
 * from a long list to another page can land mid-content. Reset to the top on
 * every push/replace, but leave POP (browser back/forward) alone so the
 * browser's own scroll restoration still works there.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, navigationType]);

  return null;
}
