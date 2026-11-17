import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("athub") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("athub", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="athub" params={params} /> }
