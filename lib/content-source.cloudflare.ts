import source from "../content/athub/API.md?raw"

// Embed the same source document at build time; Workers have no project filesystem.
export const sourcePath = () => "content/athub/API.md"

export const getContentSource = async () => source
