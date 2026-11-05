const POLICY = "https://khomichenko.com/privacy-policy/";

/** Old /privacy address. Sends the browser to the shared policy. */
export function Privacy() {
  window.location.replace(POLICY);
  return null;
}
