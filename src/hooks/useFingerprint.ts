// Replace readTemplate() with your actual fingerprint scanner SDK call.
// The mock below lets you test the full UI flow without hardware attached.
const MOCK_TEMPLATE =
  "AAABAAABAAAAAQAAAAEAAAABAAAA" +
  "BAAAAAQAAAABAAAABAAAABAAAABAAAA" +
  "mock_fingerprint_template_base64"

export function useFingerprint() {
  async function readTemplate(): Promise<string> {
    // TODO: replace with real SDK call, e.g.:
    // return await ZKTecoSDK.capture()
    // return await DigitalPersonaSDK.readTemplate()
    await new Promise((r) => setTimeout(r, 1200)) // simulate scan delay
    return MOCK_TEMPLATE
  }

  return { readTemplate }
}
